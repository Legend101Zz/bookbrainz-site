/*
 * Copyright (C) 2015  Ben Ockmore
 *               2015  Sean Burke
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

var React = require('react');
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
var PageHeader = require('react-bootstrap').PageHeader;
var Select = require('../input/select2.jsx');
var SearchSelect = require('../input/entity-search.jsx');
var _ = require('underscore');

var renderRelationship = require('../../../server/helpers/render.js');

function getRelationshipTypeById(relationships, id) {
	return _.find(relationships, (relationship) => relationship.id === parseInt(id));
}

var RelationshipRow = React.createClass({
	getInitialState: function() {
		return {
			deleted: false,
			entitiesSwapped: false,
			swapped: false
		};
	},
	getValue: function() {
		return {
			source: this.refs.source.getValue(),
			target: this.refs.target.getValue(),
			type: this.refs.type.getValue() ? parseInt(this.refs.type.getValue(), 10) : null
		};
	},
	swap: function() {
		this.setState({a: this.state.b, b: this.state.a});
	},
	delete: function() {
		this.setState({deleted: true});
		this.props.onDelete();
	},
	reset: function() {
		this.setState({deleted: false});
	},
	added: function() {
		const initiallyEmpty = !this.props.relationship.initialTarget && !this.props.relationship.initialType;
		const nowSet = this.props.relationship.target || this.props.relationship.type;
		return Boolean(initiallyEmpty && nowSet);
	},
	edited: function() {
		const rel = this.props.relationship;
		const aChanged = (rel.source && rel.source.bbid) !== (rel.initialSource && rel.initialSource.bbid);
		const bChanged = (rel.target && rel.target.bbid) !== (rel.initialTarget && rel.initialTarget.bbid);
		const typeChanged = rel.type !== rel.initialType;
		return Boolean(aChanged || bChanged || typeChanged);
	},
	renderedRelationship() {
		'use strict';

		const rel = this.props.relationship;

		let aName = '...';
		if (rel.source) {
			aName = rel.source.default_alias ? rel.source.default_alias.name : '(unnamed)';
		}

		let bName = '...';
		if (rel.target) {
			bName = rel.target.default_alias ? rel.target.default_alias.name : '(unnamed)';
		}

		const relationshipType =
			_.find(this.props.relationshipTypes, (rel_type) =>
				rel_type.id === rel.type
			);

		if(!relationshipType) {
			return null;
		}

		return {
			__html: renderRelationship([rel.source, rel.target], relationshipType, null)
		};

		if(rel.type) {
			return `${aName} ${relationshipType.description} ${bName}`;
		}

		return "";
	},
	rowClass() {
		if (this.state.deleted) {
			return " list-group-item-danger";
		}
		if (this.added()) {
			return " list-group-item-success";
		}
		if (this.edited()) {
			return " list-group-item-warning";
		}
		return "";
	},
	valid() {
		const rel = this.props.relationship;
		if (rel.source && rel.target && rel.type) {
			return true;
		} else {
			return false;
		}
	},
	render: function() {
		const deleteButton = this.rowClass() || this.valid() ? (
			<Button bsStyle="danger" onClick={this.delete}>
				<span className='fa fa-times'/>&nbsp;Delete
				<span className='sr-only'> Relationship</span>
			</Button>
		) : null;

		const resetButton = (
			<Button bsStyle="primary" onClick={this.reset}>
				<span className='fa fa-undo'/>&nbsp;Reset
				<span className='sr-only'> Relationship</span>
			</Button>
		);

		const swapButton = (
			<Button bsStyle="primary" onClick={this.props.onSwap}>
				<span className='fa fa-exchange'/>&nbsp;Swap
				<span className='sr-only'> Entities</span>
			</Button>
		);

		const sourceEntity = this.props.relationship.source;
		if(sourceEntity) {
			sourceEntity.text = sourceEntity.default_alias ? sourceEntity.default_alias.name : '(unnamed)';
			sourceEntity.id = sourceEntity.bbid;
		}

		const targetEntity = this.props.relationship.target;
		if(targetEntity) {
			targetEntity.text = targetEntity.default_alias ? targetEntity.default_alias.name : '(unnamed)';
			targetEntity.id = targetEntity.bbid;
		}

		const validationState =
			this.rowClass() ? (this.valid() ? 'success' : 'error') : null;

		const targetInput = (
			<SearchSelect
				ref="target"
				collection='entity'
				value={targetEntity}
				placeholder='Select entity…'
				select2Options={{width: '100%'}}
				labelClassName='col-md-4'
				wrapperClassName='col-md-4'
				disabled={this.state.deleted || (targetEntity && targetEntity.bbid) === this.props.entity.bbid}
				bsStyle={validationState}
				standalone
				onChange={this.props.onChange}
				/>
		);

		return (
			<div className={"list-group-item margin-top-1" + this.rowClass()}>
				<div className="row">
					<div className="col-md-1 text-center margin-top-1">
						<Input className="margin-left-0" type="checkbox" label=" " disabled={this.state.deleted}/>
					</div>
					<div className="col-md-11">
						<div className="row">
							<SearchSelect
								ref="source"
								collection='entity'
								value={sourceEntity}
								placeholder='Select entity…'
								select2Options={{width: '100%'}}
								labelClassName='col-md-4'
								wrapperClassName='col-md-4'
								disabled={this.state.deleted || (sourceEntity && sourceEntity.bbid) === this.props.entity.bbid}
								standalone
								bsStyle={validationState}
								onChange={this.props.onChange}
								/>
							<div className="col-md-4">
								<Select
									placeholder='Select relationship type…'
									options={this.props.relationshipTypes}
									noDefault
									idAttribute='id'
									defaultValue={this.props.relationship.type}
									labelAttribute='label'
									ref='type'
									disabled={this.state.deleted}
									select2Options={{width: '100%'}}
									bsStyle={validationState}
									onChange={this.props.onChange}
									/>
							</div>
							{targetInput}
						</div>
						<div className="row">
							<div className="col-md-9" style={{"verticalAlign": "bottom"}}>
								<p dangerouslySetInnerHTML={this.renderedRelationship()} />
							</div>
							<div className="col-md-3 text-right">
								{this.state.deleted ? null : swapButton}
								{this.state.deleted ? resetButton : deleteButton}
							</div>

						</div>
					</div>
				</div>

			</div>
		);
	}
});

var RelationshipEditor = React.createClass({
	getInitialState: function() {
		'use strict';

		var existing = this.props.relationships || [];
		existing.push({
			source: this.props.entity,
			target: null,
			type: null
		});

		existing.forEach(function(rel, i) {
			rel.key = i;
			rel.initialSource = rel.source;
			rel.initialTarget = rel.target;
			rel.initialType = rel.type;
		});

		return {
			loadedEntities: this.props.loadedEntities,
			relationships: existing,
			rowsSpawned: existing.length
		};
	},
	getValue: function() {
		'use strict';

		const relationships = [];

		for (let i = 0; i < this.state.relationships.length; i++) {
			relationships.push(this.refs[i].getValue());
		}

		return relationships;
	},
	handleSubmit: function() {

	},
	getInternalValue() {
		const updatedRelationships = this.getValue();

		updatedRelationships.forEach((rel, idx) => {
			rel.key = this.state.relationships[idx].key;
			rel.initialSource = this.state.relationships[idx].initialSource;
			rel.initialTarget = this.state.relationships[idx].initialTarget;
			rel.initialType = this.state.relationships[idx].initialType;
		});

		return updatedRelationships;
	},
	swap(changedRowIndex) {
		const updatedRelationships = this.getInternalValue();

		updatedRelationships[changedRowIndex].source = this.state.relationships[changedRowIndex].target;
		updatedRelationships[changedRowIndex].target = this.state.relationships[changedRowIndex].source;

		const rowsSpawned =
			this.addRowIfNeeded(updatedRelationships, changedRowIndex);

		this.setState({
			relationships: updatedRelationships,
			rowsSpawned
		});
	},
	stateUpdateNeeded(changedRowIndex) {
		'use strict';

		const updatedRelationship = this.refs[changedRowIndex].getValue();
		const existingRelationship = this.state.relationships[changedRowIndex];

		const sourceJustSetOrUnset = (
			!existingRelationship.source && updatedRelationship.source ||
			existingRelationship.source && !updatedRelationship.source
		);

		const targetJustSetOrUnset = (
			!existingRelationship.target && existingRelationship.target ||
			existingRelationship.target && !existingRelationship.target
		);

		const typeJustSetOrUnset = (
			!existingRelationship.type && updatedRelationship.type ||
			existingRelationship.type && !updatedRelationship.type
		);

		return Boolean(
			sourceJustSetOrUnset || targetJustSetOrUnset || typeJustSetOrUnset
		);
	},
	addRowIfNeeded: function(updatedRelationships, changedRowIndex) {
		'use strict';
		let rowsSpawned = this.state.rowsSpawned;
		if (changedRowIndex === this.state.relationships.length - 1) {
			updatedRelationships.push({
				initialSource: this.props.entity,
				initialTarget: null,
				initialType: null,
				source: this.props.entity,
				target: null,
				type: null,
				key: rowsSpawned++
			});
		}

		return rowsSpawned;
	},
	deleteRowIfNew: function(rowToDelete) {
		if (this.refs[rowToDelete].added()) {
			const updatedRelationships = this.getInternalValue();

			updatedRelationships.splice(rowToDelete, 1);

			this.setState({
				relationships: updatedRelationships
			});
		}
	},
	handleChange: function(changedRowIndex) {
		'use strict';

		const updatedRelationships = this.getInternalValue();

		const rowsSpawned =
			this.addRowIfNeeded(updatedRelationships, changedRowIndex);

		this.setState({
			relationships: updatedRelationships,
			rowsSpawned
		});
	},
	render: function() {
		'use strict';

		const rows = this.state.relationships.map((rel, index) => (
			<RelationshipRow
				key={rel.key}
				ref={index}
				relationship={rel}
				onChange={this.handleChange.bind(null, index)}
				onSwap={this.swap.bind(null, index)}
				onDelete={this.deleteRowIfNew.bind(null, index)}
				{...this.props}
			/>
		));

		return (
			<div>
				<PageHeader>Relationship Editor</PageHeader>
				<div className="list-group">
					{rows}
				</div>
			</div>
		);
	}
});

module.exports = RelationshipEditor;
