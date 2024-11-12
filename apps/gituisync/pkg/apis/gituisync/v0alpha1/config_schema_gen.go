//
// Code generated by grafana-app-sdk. DO NOT EDIT.
//

package v0alpha1

import (
	"github.com/grafana/grafana-app-sdk/resource"
)

// schema is unexported to prevent accidental overwrites
var (
	schemaConfig = resource.NewSimpleSchema("gituisync.grafana.app", "v0alpha1", &Config{}, &ConfigList{}, resource.WithKind("Config"),
		resource.WithPlural("configs"), resource.WithScope(resource.NamespacedScope))
	kindConfig = resource.Kind{
		Schema: schemaConfig,
		Codecs: map[resource.KindEncoding]resource.Codec{
			resource.KindEncodingJSON: &ConfigJSONCodec{},
		},
	}
)

// Kind returns a resource.Kind for this Schema with a JSON codec
func ConfigKind() resource.Kind {
	return kindConfig
}

// Schema returns a resource.SimpleSchema representation of Config
func ConfigSchema() *resource.SimpleSchema {
	return schemaConfig
}

// Interface compliance checks
var _ resource.Schema = kindConfig