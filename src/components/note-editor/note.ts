
export class Note {
    id: string;
    title: string;
    thoughts: string[];

    constructor(
        id: string = '',
        title: string = '',
        thoughts: string[] = []
    ) {
        this.id = id;
        this.title = title;
        this.thoughts = thoughts;
    }

    addThought(thought: string, index: number = -1) {
        if (index === -1) {
            this.thoughts.push(thought);
        } else {
            this.thoughts.splice(index, 0, thought);
        }
    }

    removeThought(thought: string) {
        this.thoughts = this.thoughts.filter(t => t !== thought);
    }

    updateThought(thought: string, newThought: string) {
        const index = this.thoughts.indexOf(thought);
        if (index !== -1) {
            this.thoughts[index] = newThought;
        }
    }
}