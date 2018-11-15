package extensions

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/coreos/go-semver/semver"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/http/client"
)

// GET request on /api/extensions/:id
func (handler *Handler) extensionInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	extensionIdentifier, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid extension identifier route variable", err}
	}
	extensionID := portainer.ExtensionID(extensionIdentifier)

	// TODO: store somewhere else + constant
	extensionData, err := client.Get(portainer.ExtensionDefinitionsURL, 30)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve extension definitions", err}
	}

	var extensions []portainer.Extension
	err = json.Unmarshal(extensionData, &extensions)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to parse external extension definitions", err}
	}

	var extension portainer.Extension
	for _, p := range extensions {
		if p.ID == extensionID {
			extension = p
			break
		}
	}

	storedExtension, err := handler.ExtensionService.Extension(extensionID)
	if err == portainer.ErrObjectNotFound {
		return response.JSON(w, extension)
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a extension with the specified identifier inside the database", err}
	}

	extension.Enabled = storedExtension.Enabled

	extensionVer := semver.New(extension.Version)
	log.Println(extension.Version)
	pVer := semver.New(storedExtension.Version)
	log.Println(storedExtension.Version)

	if pVer.LessThan(*extensionVer) {
		extension.UpdateAvailable = true
	}

	return response.JSON(w, extension)
}
