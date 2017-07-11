# tetool - Node CLI tool for managing table-editor configurations

Inspired by https://www.sitepoint.com/javascript-command-line-interface-cli-node-js


## Requirements

* [Node.js](http://nodejs.org/) version 6.10.0 or higher


## Installation

`npm install -g tetool`


## Usage

	tetool --help
    tetool --site <targetSiteDir> --title <targetSiteTitle>
    tetool --site <targetSiteDir> --source <ontologySourceDir>
    tetool --site <targetSiteDir> --source <ontologySourceDir>@<branchName>

## Examples

    tetool --site ../exposure-inca-form/ --title 'Exposure Ontology'
    tetool --site ../exposure-inca-form/ --source ../environmental-exposure-ontology/
    tetool --site ../planteome-inca-form/ --source ../plant-trait-ontology/@clean-dp

### Building the IncaForm site for `exposure-inca-form`

This example assumes that a single ontology repo will be used. For this example, the local copy of the `environmental-exposure-ontology` repo will be used as a source of patterns and XSVs.

- `cd` to the site directory, which may not yet contain a `docs/` directory:
	cd exposure-inca-form/
- Use `tetool` to create a site directory:
	tetool --site ./
- This will create `docs/`, `docs/configurations/`, and `docs/index.html`
- Use `tetool` to augment the site directory with configurations based upon ontology source directories
	tetool --site ./ --source ../environmental-exposure-ontology/

## Assumptions about the source directory structure

In order to simplify the use of `tetool`, we make the assumption that a source ontology repository has a hierarchy resembling that in https://github.com/EnvironmentOntology/environmental-exposure-ontology:
    source-repo/
        src/
            ontology/
                a.csv
                b.csv
                ...
            patterns/
                a.yaml
                b.yaml
                ...

In order to support Planteome, this was kludged to support structures like those in https://github.com/Planteome/plant-trait-ontology:
    source-repo/
        patterns/
            a.yaml
            a/
                a.csv
            b.yaml
            b/
                b.csv

#### Problems with GO

The current GO ontology https://github.com/geneontology/go-ontology does not follow either of these patterns, and therefore `tetool` will fail to find the appropriate patterns and XSV files. So `tetool` must be fixed to support GO.


## Developing `tetool`

- Clone the repo
- cd to the repo directory
- npm install # Install dependencies
- Invent!
- npm install -g # Install tetool globally, from the local working directory


### Version History

0.0.1 - Initial version of tetool installed into NPM

