package edgestacks

import (
	"errors"
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	portainererrors "github.com/portainer/portainer/api/internal/errors"
)

type updateStatusPayload struct {
	Error      string
	Status     *portainer.EdgeStackStatusType
	EndpointID *portainer.EndpointID
}

func (payload *updateStatusPayload) Validate(r *http.Request) error {
	if payload.Status == nil {
		return errors.New("Invalid status")
	}
	if payload.EndpointID == nil {
		return errors.New("Invalid EndpointID")
	}
	if *payload.Status == portainer.StatusError && govalidator.IsNull(payload.Error) {
		return errors.New("Error message is mandatory when status is error")
	}
	return nil
}

func (handler *Handler) edgeStackStatusUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	stackID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid stack identifier route variable", err}
	}

	stack, err := handler.DataStore.EdgeStack().EdgeStack(portainer.EdgeStackID(stackID))
	if err.Error() == portainererrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a stack with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a stack with the specified identifier inside the database", err}
	}

	var payload updateStatusPayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(*payload.EndpointID))
	if err.Error() == portainererrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEdgeEndpointOperation(r, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	stack.Status[*payload.EndpointID] = portainer.EdgeStackStatus{
		Type:       *payload.Status,
		Error:      payload.Error,
		EndpointID: *payload.EndpointID,
	}

	err = handler.DataStore.EdgeStack().UpdateEdgeStack(stack.ID, stack)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the stack changes inside the database", err}
	}

	return response.JSON(w, stack)

}
