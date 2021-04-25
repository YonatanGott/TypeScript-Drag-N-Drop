import { AutoBind } from "../decorators/AutoBind";
import { Draggable } from "../models/Interfaces";
import { Project } from "../models/ProjectClass";
import { Component } from "./Base";

export class ProjectItem
	extends Component<HTMLUListElement, HTMLLIElement>
	implements Draggable {
	private project: Project;

	get persons() {
		if (this.project.people === 1) {
			return "1 Person";
		} else {
			return `${this.project.people} Persons`;
		}
	}

	constructor(hostId: string, project: Project) {
		super("single-project", hostId, false, project.id);
		this.project = project;

		this.configure();
		this.renderContent();
	}
	@AutoBind
	handleDragEnd(_: DragEvent) {}
	@AutoBind
	handleDragStart(event: DragEvent) {
		event.dataTransfer!.setData("text/plain", this.project.id);
		event.dataTransfer!.effectAllowed = "move";
	}
	configure() {
		this.element.addEventListener("dragstart", this.handleDragStart);
		this.element.addEventListener("dragend", this.handleDragEnd);
	}
	renderContent() {
		this.element.querySelector("h2")!.textContent = this.project.title;
		this.element.querySelector("h4")!.textContent = this.persons + " assigned";
		this.element.querySelector("p")!.textContent = this.project.description;
	}
}
