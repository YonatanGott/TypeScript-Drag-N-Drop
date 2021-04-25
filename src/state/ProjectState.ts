import { Project, ProjectStatus } from "../models/ProjectClass.js";

// state Management
type Listener<T> = (items: T[]) => void;

class State<T> {
	protected listeners: Listener<T>[] = [];
	addlistener(listenerFunc: Listener<T>) {
		this.listeners.push(listenerFunc);
	}
}

export class ProjectState extends State<Project> {
	private projects: any[] = [];
	private static instance: ProjectState;

	private constructor() {
		super();
	}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addProject(title: string, description: string, numOfPeople: number) {
		const newProject = new Project(
			Math.random().toString(),
			title,
			description,
			numOfPeople,
			ProjectStatus.Active
		);
		this.projects.push(newProject);
		this.updateListeners();
	}

	moveProject(projectId: string, newStatus: ProjectStatus) {
		const project = this.projects.find((project) => project.id === projectId);
		if (project && project.status !== newStatus) {
			project.status = newStatus;
			this.updateListeners();
		}
	}

	private updateListeners() {
		for (const listenerFunc of this.listeners) {
			listenerFunc(this.projects.slice());
		}
	}
}

export const projectState = ProjectState.getInstance();
