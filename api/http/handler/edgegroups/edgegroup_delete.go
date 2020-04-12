package edgegroups

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

func (handler *Handler) edgeGroupDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid edge group identifier route variable", err}
	}

	_, err = handler.EdgeGroupService.EdgeGroup(portainer.EdgeGroupID(edgeGroupID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an edge group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an edge group with the specified identifier inside the database", err}
	}

	err = handler.EdgeGroupService.DeleteEdgeGroup(portainer.EdgeGroupID(edgeGroupID))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the edge group from the database", err}
	}

	return response.Empty(w)

}
