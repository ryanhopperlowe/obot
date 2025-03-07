package types

type Project struct {
	Metadata
	ProjectManifest
	AssistantID string `json:"assistantID,omitempty"`
	Editor      bool   `json:"editor"`
	ParentID    string `json:"parentID,omitempty`
}

type ProjectManifest struct {
	ThreadManifest
}

type ProjectList List[Project]
