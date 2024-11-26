package v0alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	common "github.com/grafana/grafana/pkg/apimachinery/apis/common/v0alpha1"
)

// When this code is changed, make sure to update the code generation.
// As of writing, this can be done via the hack dir in the root of the repo: ./hack/update-codegen.sh provisioning
// If you've opened the generated files in this dir at some point in VSCode, you may also have to re-open them to clear errors.

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type Repository struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   RepositorySpec   `json:"spec,omitempty"`
	Status RepositoryStatus `json:"status,omitempty"`
}

type LocalRepositoryConfig struct {
	Path string `json:"path,omitempty"`
}

type S3RepositoryConfig struct {
	Region string `json:"region,omitempty"`
	Bucket string `json:"bucket,omitempty"`

	// TODO: Add ACL?
	// TODO: Encryption??
	// TODO: How do we define access? Secrets?
}

type GitHubRepositoryConfig struct {
	// The owner of the repository (e.g. example in `example/test` or `https://github.com/example/test`).
	Owner string `json:"owner,omitempty"`
	// The name of the repository (e.g. test in `example/test` or `https://github.com/example/test`).
	Repository string `json:"repository,omitempty"`
	// The branch to use in the repository.
	// By default, this is the main branch.
	Branch string `json:"branch,omitempty"`
	// Token for accessing the repository.
	// TODO: this should be part of secrets and a simple reference.
	Token string `json:"token,omitempty"`
	// WebhookURL is the URL to send webhooks events to.
	// By default, the system will generate a URL for you but you can use this one to run
	// grafana locally and test the webhooks.
	// TODO: This should be generated by the controller and not user-provided.
	WebhookURL string `json:"webhookURL,omitempty"`
	// WebhookSecret is the secret used to validate incoming webhooks.
	// TODO: this should be generated by the controller and not user-provided.
	WebhookSecret string `json:"webhookSecret,omitempty"`

	// TODO: Do we want an SSH url instead maybe?
	// TODO: On-prem GitHub Enterprise support?

	// SubmitChangeMode defines how changes are submitted to the repository.
	// Possible values are:
	// - "pull-request-only": Changes are submitted via a pull request.
	// - "direct-push-only": Changes are submitted directly to the configured branch.
	// - "pull-request-by-default": Changes are submitted via a pull request if possible.
	// - "direct-push-by-default": Changes are submitted directly to the configured branch if possible.
	// Default: "pull-request-by-default"
	SubmitChangeMode SubmitChangeMode `json:"submitChangeMode,omitempty"`
}

// SubmitChangeMode defines how changes are submitted to the repository.
// +enum
type SubmitChangeMode string

// SubmitChangeMode values
const (
	PullRequestOnlyMode      SubmitChangeMode = "pull-request-only"
	DirectPushOnlyMode       SubmitChangeMode = "direct-push-only"
	PullRequestByDefaultMode SubmitChangeMode = "pull-request-by-default"
	DirectPushByDefaultMode  SubmitChangeMode = "direct-push-by-default"
)

// RepositoryType defines the types of Repository
// +enum
type RepositoryType string

// RepositoryType values
const (
	LocalRepositoryType  RepositoryType = "local"
	S3RepositoryType     RepositoryType = "s3"
	GitHubRepositoryType RepositoryType = "github"
)

type RepositorySpec struct {
	// Describe the feature toggle
	Title string `json:"title"`

	// Describe the feature toggle
	Description string `json:"description,omitempty"`

	// The folder that is backed by the repository.
	// The value is a reference to the Kubernetes metadata name of the folder in the same namespace.
	Folder string `json:"folder,omitempty"`

	// Should we prefer emitting YAML for this repository, e.g. upon export?
	// Editing existing dashboards will continue to emit the file format used in the repository. (TODO: implement this)
	// If you delete and then recreate a dashboard, it will switch to the preferred format.
	PreferYAML bool `json:"preferYaml,omitempty"`

	// Edit options within the repository
	Editing EditingOptions `json:"editing"`

	// The repository type.  When selected oneOf the values below should be non-nil
	Type RepositoryType `json:"type"`

	// The repository on the local file system.
	// Mutually exclusive with s3 and github.
	Local *LocalRepositoryConfig `json:"local,omitempty"`

	// The repository in an S3 bucket.
	// Mutually exclusive with local and github.
	S3 *S3RepositoryConfig `json:"s3,omitempty"`

	// The repository on GitHub.
	// Mutually exclusive with local and s3.
	// TODO: github or just 'git'??
	GitHub *GitHubRepositoryConfig `json:"github,omitempty"`
}

type EditingOptions struct {
	// End users can create new files in the remote file system
	Create bool `json:"create"`
	// End users can update existing files in the remote file system
	Update bool `json:"update"`
	// End users can delete existing files in the remote file system
	Delete bool `json:"delete"`
}

// The status of a Repository.
// This is expected never to be created by a kubectl call or similar, and is expected to rarely (if ever) be edited manually.
// As such, it is also a little less well structured than the spec, such as conditional-but-ever-present fields.
type RepositoryStatus struct {
	// The Git commit we're currently synced to.
	// A non-empty value only matters if we use a git storage backend.
	// Useful for no-clone Git clients and if cloning Git clients ever lose their clones.
	CurrentGitCommit string `json:"currentGitCommit,omitempty"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type RepositoryList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Repository `json:"items,omitempty"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type HelloWorld struct {
	metav1.TypeMeta `json:",inline"`

	Whom string `json:"whom,omitempty"`
}

// This is a container type for any resource type
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type ResourceWrapper struct {
	metav1.TypeMeta `json:",inline"`

	// Path to the remote file
	Path string `json:"path,omitempty"`

	// The commit hash (if exists)
	Ref string `json:"ref,omitempty"`

	// The repo hash value
	Hash string `json:"hash,omitempty"`

	// The modified time in the remote file system
	Timestamp *metav1.Time `json:"timestamp,omitempty"`

	// If errors exist, show them here
	Errors []string `json:"errors,omitempty"`

	// Different flavors of the same object
	Resource ResourceObjects `json:"resource"`
}

type ResourceObjects struct {
	File   common.Unstructured `json:"file,omitempty"`
	Store  common.Unstructured `json:"store,omitempty"`
	DryRun common.Unstructured `json:"dryRun,omitempty"`
}

// Dummy object to return for webhooks
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type WebhookResponse struct {
	metav1.TypeMeta `json:",inline"`

	Status string `json:"status,omitempty"`
}
