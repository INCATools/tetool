# tetool - Node CLI tool for managing table-editor configurations

Inspired by https://www.sitepoint.com/javascript-command-line-interface-cli-node-js


## Requirements

* [Node.js](http://nodejs.org/)


## Installation

`npm install -g tetool`


## Usage

	tetool --help
    tetool --site ../exposure-inca-form/ --title 'Exposure Ontology' --source ../environmental-exposure-ontology/


## Examples

### Building the IncaForm site for `exposure-inca-form`

This example assumes that a single ontology repo will be used. For this example, the local copy of the `environmental-exposure-ontology` repo will be used as a source of patterns and XSVs.

- `cd` to the site directory, which may not yet contain a `docs/` directory:
	cd exposure-inca-form/
- Use `tetool` to create a site directory:
	tetool --site ./
- This will create `docs/`, `docs/configurations/`, and `docs/index.html`
- Use `tetool` to augment the site directory with generated configurations:
	tetool --site ./


## Developing `tetool`

- Clone the repo
- cd to the repo directory
- npm install # Install dependencies
- Invent!
- npm install -g # Install tetool globally, but from the working directory


### Version History

0.0.1 - Initial version of tetool installed into NPM

