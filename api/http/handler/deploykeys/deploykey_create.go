package deploykeys

import (
	"encoding/hex"
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type deploykeyCreatePayload struct {
	Name           string
	Privatekeypath string
	Publickeypath  string
	UserName       string
	LastUsage      string
}

func (payload *deploykeyCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid deploykey Name")
	}
	return nil
}

// POST request on /api/deploykeys
func (handler *Handler) deploykeyCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload deploykeyCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	deploykeys, err := handler.DeploykeyService.Deploykeys()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve deploykeys from the database", err}
	}

	for _, deploykey := range deploykeys {
		if deploykey.Name == payload.Name {
			return &httperror.HandlerError{http.StatusConflict, "This name is already associated to a deploykey", portainer.ErrDeploykeyAlreadyExists}
		}
	}

	privatepath, pubkeypath, errrrr := handler.DigitalDeploykeyService.GenerateKeyPair()

	if errrrr != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid  key  payload", errrrr}
	}

	encodedStr := hex.EncodeToString(privatepath)
	encodedStr1 := hex.EncodeToString(pubkeypath)
	dateTime := time.Now().Local().Format("2006-01-02 15:04:05")

	deploykey := &portainer.Deploykey{
		Name:           payload.Name,
		Privatekeypath: encodedStr,
		Publickeypath:  encodedStr1,
		UserName:       payload.UserName,
		LastUsage:      dateTime,
	}

	err = handler.DeploykeyService.CreateDeploykey(deploykey)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the deploykey inside the database", err}
	}

	return response.JSON(w, deploykey)
}
func BytesToString(data []byte) string {
	return string(data[:])
}
