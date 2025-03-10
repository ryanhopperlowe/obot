package types

type WorkflowExecution struct {
	Metadata
	Workflow  WorkflowManifest `json:"workflow,omitempty"`
	StartTime Time             `json:"startTime"`
	EndTime   *Time            `json:"endTime"`
	Input     string           `json:"input"`
	Error     string           `json:"error,omitempty"`
}

type WorkflowExecutionList List[WorkflowExecution]
