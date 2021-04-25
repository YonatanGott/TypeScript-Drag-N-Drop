// state Management
type Listener<T> = (items: T[]) => void;

class State<T> {
	protected listeners: Listener<T>[] = [];

	addlistener(listenerFunc: Listener<T>) {
		this.listeners.push(listenerFunc);
	}
}

class ProjectState extends State<Project> {
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

const projectState = ProjectState.getInstance();

// Drag & Drop Interfaces
interface Draggable {
	handleDragStart(event: DragEvent): void;
	handleDragEnd(event: DragEvent): void;
}
interface DragTarget {
	handleDragOver(event: DragEvent): void;
	handleDrop(event: DragEvent): void;
	handleDragLeave(event: DragEvent): void;
}

// Validation
interface Validatable {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
}

function validate(validatableInput: Validatable) {
	let isValid = true;
	if (validatableInput.required) {
		isValid = isValid && validatableInput.value.toString().trim().length !== 0;
	}
	if (
		validatableInput.minLength != null &&
		typeof validatableInput.value === "string"
	) {
		isValid =
			isValid && validatableInput.value.length >= validatableInput.minLength;
	}
	if (
		validatableInput.maxLength != null &&
		typeof validatableInput.value === "string"
	) {
		isValid =
			isValid && validatableInput.value.length <= validatableInput.maxLength;
	}
	if (
		validatableInput.min != null &&
		typeof validatableInput.value === "number"
	) {
		isValid = isValid && validatableInput.value >= validatableInput.min;
	}
	if (
		validatableInput.max != null &&
		typeof validatableInput.value === "number"
	) {
		isValid = isValid && validatableInput.value <= validatableInput.max;
	}
	return isValid;
}

// Decorator
function AutoBind(
	_target: any,
	_method: string,
	descriptor: PropertyDescriptor
) {
	const originalMethod = descriptor.value;
	const adjDescriptor: PropertyDescriptor = {
		configurable: true,
		get() {
			const boundFunc = originalMethod.bind(this);
			return boundFunc;
		},
	};
	return adjDescriptor;
}

// Classes
// Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
	templateElement: HTMLTemplateElement;
	hostElement: T;
	element: U;

	constructor(
		templateId: string,
		hostElementId: string,
		insertAtStart: boolean,
		newElementId?: string
	) {
		this.templateElement = document.getElementById(
			templateId
		)! as HTMLTemplateElement;
		this.hostElement = document.getElementById(hostElementId)! as T;

		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
		this.element = importedNode.firstElementChild as U;
		if (newElementId) {
			this.element.id = newElementId;
		}

		this.attach(insertAtStart);
	}

	private attach(insertAtStart: boolean) {
		this.hostElement.insertAdjacentElement(
			insertAtStart ? "afterbegin" : "beforeend",
			this.element
		);
	}

	abstract configure(): void;
	abstract renderContent(): void;
}

enum ProjectStatus {
	Active,
	Finished,
}

class Project {
	constructor(
		public id: string,
		public title: string,
		public description: string,
		public people: number,
		public status: ProjectStatus
	) {}
}

class ProjectItem
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
	handleDragEnd(event: DragEvent) {
		console.log(event);
	}
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

class ProjectList
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

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
	titleInputElement: HTMLInputElement;
	descriptionInputElement: HTMLInputElement;
	peopleInputElement: HTMLInputElement;

	constructor() {
		super("project-input", "app", true, "user-input");
		this.titleInputElement = this.element.querySelector(
			"#title"
		)! as HTMLInputElement;
		this.descriptionInputElement = this.element.querySelector(
			"#description"
		)! as HTMLInputElement;
		this.peopleInputElement = this.element.querySelector(
			"#people"
		)! as HTMLInputElement;
		this.configure();
	}

	configure() {
		this.element.addEventListener("submit", this.handleSubmit);
	}

	renderContent() {}

	private getUserInput(): [string, string, number] | void {
		const enteredTitle = this.titleInputElement.value;
		const enteredDescription = this.descriptionInputElement.value;
		const enteredPeople = this.peopleInputElement.value;
		// Validation Here
		const titleValidation: Validatable = {
			value: enteredTitle,
			required: true,
		};
		const descriptionValidation: Validatable = {
			value: enteredDescription,
			required: true,
			minLength: 5,
		};
		const peopleValidation: Validatable = {
			value: +enteredPeople,
			required: true,
			min: 1,
			max: 5,
		};
		if (
			!validate(titleValidation) ||
			!validate(descriptionValidation) ||
			!validate(peopleValidation)
		) {
			alert("Invalid Input");
			return;
		} else {
			return [enteredTitle, enteredDescription, +enteredPeople];
		}
	}

	private clearInputs() {
		this.titleInputElement.value = "";
		this.descriptionInputElement.value = "";
		this.peopleInputElement.value = "";
	}

	@AutoBind
	private handleSubmit(event: Event) {
		event.preventDefault();
		const userInput = this.getUserInput();
		if (Array.isArray(userInput)) {
			const [title, desc, people] = userInput;
			projectState.addProject(title, desc, people);
			this.clearInputs();
		}
	}
}

const input = new ProjectInput();
const activeList = new ProjectList("active");
const finishedList = new ProjectList("finished");
