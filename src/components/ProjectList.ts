import { AutoBind } from "../decorators/AutoBind";
import { DragTarget } from "../models/Interfaces";
import { Project, ProjectStatus } from "../models/ProjectClass";
import { projectState } from "../state/ProjectState";
import { Component } from "./Base";
import { ProjectItem } from "./ProjectItem";

export class ProjectList
	extends Component<HTMLDivElement, HTMLElement>
	implements DragTarget {
	assignedProjects: Project[];

	constructor(private type: "active" | "finished") {
		super("project-list", "app", false, `${type}-projects`);
		this.assignedProjects = [];
		this.configure();
		this.renderContent();
	}

	@AutoBind
	handleDragOver(event: DragEvent) {
		if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
			event.preventDefault();
			const listEle = this.element.querySelector("ul")!;
			listEle.classList.add("droppable");
		}
	}
	@AutoBind
	handleDrop(event: DragEvent) {
		const projectId = event.dataTransfer!.getData("text/plain");
		projectState.moveProject(
			projectId,
			this.type === "active" ? ProjectStatus.Active : ProjectStatus.Finished
		);
	}
	@AutoBind
	handleDragLeave(_: DragEvent) {
		const listEle = this.element.querySelector("ul")!;
		listEle.classList.remove("droppable");
	}

	configure() {
		this.element.addEventListener("dragover", this.handleDragOver);
		this.element.addEventListener("dragleave", this.handleDragLeave);
		this.element.addEventListener("drop", this.handleDrop);
		projectState.addlistener((projects: Project[]) => {
			const relevantProjects = projects.filter((project) => {
				if (this.type === "active") {
					return project.status === ProjectStatus.Active;
				}
				return project.status === ProjectStatus.Finished;
			});
			this.assignedProjects = relevantProjects;
			this.renderProjects();
		});
	}

	renderContent() {
		const listId = `${this.type}-projects-list`;
		this.element.querySelector("ul")!.id = listId;
		this.element.querySelector("h2")!.textContent =
			this.type.toUpperCase() + " PROJECTS";
	}

	private renderProjects() {
		const listEle = document.getElementById(`${this.type}-projects-list`)!;
		listEle.innerHTML = "";
		for (const projectItem of this.assignedProjects) {
			new ProjectItem(this.element.querySelector("ul")!.id, projectItem);
		}
	}
}
