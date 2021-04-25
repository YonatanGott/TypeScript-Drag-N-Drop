import { AutoBind } from "../decorators/AutoBind.js";
import { projectState } from "../state/ProjectState.js";
import { Component } from "./Base.js";
import { Validatable, validate } from "../utils/Validation.js";

export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
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
