package edgegroups

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type edgeGroupUpdatePayload struct {
	Name      string
	Dynamic   bool
	TagIDs    []portainer.TagID
	Endpoints []portainer.EndpointID
}

func (payload *edgeGroupUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid edge group name")
	}
	if payload.Dynamic && (payload.TagIDs == nil || len(payload.TagIDs) == 0) {
		return portainer.Error("TagIDs is mandatory for a dynamic edge group")
	}
	if !payload.Dynamic && (payload.Endpoints == nil || len(payload.Endpoints) == 0) {
		return portainer.Error("Endpoints is mandatory for a static edge group")
	}
	return nil
}

func (handler *Handler) edgeGroupUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	edgeGroupID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid edge group identifier route variable", err}
	}

	var payload edgeGroupCreatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	edgeGroup, err := handler.EdgeGroupService.EdgeGroup(portainer.EdgeGroupID(edgeGroupID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an edge group with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an edge group with the specified identifier inside the database", err}
	}

	if payload.Name != "" {
		edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
		}
		for _, edgeGroup := range edgeGroups {
			if edgeGroup.Name == payload.Name && edgeGroup.ID != portainer.EdgeGroupID(edgeGroupID) {
				return &httperror.HandlerError{http.StatusBadRequest, "Edge group name must be unique", portainer.Error("Edge group name must be unique")}
			}
		}

		edgeGroup.Name = payload.Name
	}

	edgeGroup.Dynamic = payload.Dynamic
	if edgeGroup.Dynamic {
		edgeGroup.Endpoints = nil
		edgeGroup.TagIDs = payload.TagIDs
	} else {
		edgeGroup.Endpoints = payload.Endpoints
		edgeGroup.TagIDs = nil
	}

	err = handler.EdgeGroupService.UpdateEdgeGroup(edgeGroup.ID, edgeGroup)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist edge group changes inside the database", err}
	}

	return response.JSON(w, edgeGroup)
}
