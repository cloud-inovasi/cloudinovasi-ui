package schedules

import (
	"errors"
	"net/http"
	"time"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/cron"
)

type scheduleFromFilePayload struct {
	Name           string
	Image          string
	CronExpression string
	Endpoints      []portainer.EndpointID
	File           []byte
}

type scheduleFromFileContentPayload struct {
	Name           string
	CronExpression string
	Image          string
	Endpoints      []portainer.EndpointID
	FileContent    string
}

func (payload *scheduleFromFilePayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return errors.New("Invalid name")
	}
	payload.Name = name

	image, err := request.RetrieveMultiPartFormValue(r, "Image", false)
	if err != nil {
		return errors.New("Invalid image")
	}
	payload.Image = image

	cronExpression, err := request.RetrieveMultiPartFormValue(r, "CronExpression", false)
	if err != nil {
		return errors.New("Invalid cron expression")
	}
	payload.CronExpression = cronExpression

	var endpoints []portainer.EndpointID
	err = request.RetrieveMultiPartFormJSONValue(r, "Endpoints", &endpoints, false)
	if err != nil {
		return errors.New("Invalid endpoints")
	}
	payload.Endpoints = endpoints

	file, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return portainer.Error("Invalid script file. Ensure that the file is uploaded correctly")
	}
	payload.File = file

	return nil
}

func (payload *scheduleFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid schedule name")
	}

	if govalidator.IsNull(payload.Image) {
		return portainer.Error("Invalid schedule image")
	}

	if govalidator.IsNull(payload.CronExpression) {
		return portainer.Error("Invalid cron expression")
	}

	if payload.Endpoints == nil || len(payload.Endpoints) == 0 {
		return portainer.Error("Invalid endpoints payload")
	}

	if govalidator.IsNull(payload.FileContent) {
		return portainer.Error("Invalid script file content")
	}

	return nil
}

// POST /api/schedules?method=file/string
func (handler *Handler) scheduleCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method. Valid values are: file or string", err}
	}

	switch method {
	case "string":
		return handler.createScheduleFromFileContent(w, r)
	case "file":
		return handler.createScheduleFromFile(w, r)
	default:
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method. Valid values are: file or string", errors.New(request.ErrInvalidQueryParameter)}
	}
}

func (handler *Handler) createScheduleFromFileContent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload scheduleFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	schedule, err := handler.createSchedule(payload.Name, payload.Image, payload.CronExpression, payload.Endpoints, []byte(payload.FileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed executing job", err}
	}

	return response.JSON(w, schedule)
}

func (handler *Handler) createScheduleFromFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &scheduleFromFilePayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	schedule, err := handler.createSchedule(payload.Name, payload.Image, payload.CronExpression, payload.Endpoints, payload.File)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed executing job", err}
	}

	return response.JSON(w, schedule)
}

func (handler *Handler) createSchedule(name, image, cronExpression string, endpoints []portainer.EndpointID, file []byte) (*portainer.Schedule, error) {
	scheduleIdentifier := portainer.ScheduleID(handler.ScheduleService.GetNextIdentifier())

	scriptPath, err := handler.FileService.StoreScheduledJobFileFromBytes(scheduleIdentifier, file)
	if err != nil {
		return nil, err
	}

	job := &portainer.ScriptExecutionJob{
		Endpoints:  endpoints,
		Image:      image,
		ScriptPath: scriptPath,
		ScheduleID: scheduleIdentifier,
	}

	schedule := &portainer.Schedule{
		ID:                 scheduleIdentifier,
		Name:               name,
		CronExpression:     cronExpression,
		JobType:            portainer.ScriptExecutionJobType,
		ScriptExecutionJob: job,
		Created:            time.Now().Unix(),
	}

	jobContext := cron.NewScriptExecutionJobContext(handler.JobService, handler.EndpointService, handler.FileService)
	jobRunner := cron.NewScriptExecutionJobRunner(job, jobContext)

	err = handler.JobScheduler.CreateSchedule(schedule, jobRunner)
	if err != nil {
		return nil, err
	}

	err = handler.ScheduleService.CreateSchedule(schedule)
	if err != nil {
		return nil, err
	}

	return schedule, nil
}
