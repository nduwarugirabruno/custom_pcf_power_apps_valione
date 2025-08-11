import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface HierarchyNode {
    id: string;
    name: string;
    children?: HierarchyNode[] | undefined;
}

export class HierarchyTree implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this.container = container;
        this.renderTree(context);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.renderTree(context);
    }

    private renderTree(context: ComponentFramework.Context<IInputs>): void {
        const rawData = context.parameters.data?.raw;
        this.container.innerHTML = "";
        if (!rawData) {
            this.container.innerText = "Aucune donnée.";
            return;
        }
        try {
            const parsed: HierarchyNode[] = JSON.parse(rawData);
            parsed.forEach(node => {
                const treeNode = this.createNode(node);
                this.container.appendChild(treeNode);
            });
        } catch {
            this.container.innerText = "Erreur de parsing JSON." + rawData.toString();
        }
    }

    private createNode(node: HierarchyNode): HTMLElement {
        const div = document.createElement("div");
        div.className = "tree-node";
        const label = document.createElement("div");
        label.className = "tree-label";
        label.innerText = node.name;
        label.onclick = () => div.classList.toggle("collapsed");
        div.appendChild(label);

        if (node.children?.length) {
            const childrenContainer = document.createElement("div");
            childrenContainer.className = "tree-children";
            node.children.forEach(child => {
                childrenContainer.appendChild(this.createNode(child));
            });
            div.appendChild(childrenContainer);
        }

        return div;
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {
        // Cleanup
    }
}