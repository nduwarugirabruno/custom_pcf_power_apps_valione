import { IInputs, IOutputs } from "./generated/ManifestTypes";

interface HierarchyNode {
    ID: number;
    nom: string;
    prenom: string;
    nomresponsable: string;
    responsabledelentretien: string;
    StatutEntretien: string;
    StatusEntretienManager: string;
    emailcollaborateur: string;
    emailresponsable: string;
    children: HierarchyNode[];
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
        if (!this.container) return; // au cas où ngAfterViewInit n’a pas encore tourné
        this.container.innerHTML = ''; // reset du contenu

        const rawData = context.parameters.data?.raw;
        if (!rawData) {
            this.container.innerText = "Aucune donnée.";
            return;
        }
        try {
            const parsed = JSON.parse(rawData);

            if (!Array.isArray(parsed)) {
                alert("Données JSON non valides.");
                // throw new Error("Données JSON non valides.");
            }
            // Étape 1 : transformer les données brutes
            const flatList: HierarchyNode[] = parsed.map((item: {
                ID: number;
                nom: string;
                prenom: string;
                nomresponsable: string;
                responsabledelentretien: string;
                StatutEntretien: { Value: string };
                StatusEntretienManager: { Value: string };
                emailcollaborateur: string;
                emailresponsable: string;
            }) => ({
                ID: item.ID,
                nom: item.nom ?? "",
                prenom: item.prenom ?? "",
                nomresponsable: item.nomresponsable ?? "",
                responsabledelentretien: item.responsabledelentretien ?? "",
                StatutEntretien: item.StatutEntretien.Value ?? "",
                StatusEntretienManager: item.StatusEntretienManager.Value ?? "",
                emailcollaborateur: item.emailcollaborateur ?? "",
                emailresponsable: item.emailresponsable ?? "",
                children: [],
            }));

            // Étape 2 : créer un index par emailcollaborateur
            const emailToNodeMap: Record<string, HierarchyNode> = {}; // { [email: string]: HierarchyNode } = {};
            flatList.forEach((node) => {
                if (node.emailcollaborateur) {
                    emailToNodeMap[node.emailcollaborateur.toLowerCase()] = node;
                }
            });

            // Étape 3 : construire la hiérarchie
            const rootNodes: HierarchyNode[] = [];

            flatList.forEach((node) => {
                const managerEmail = node.emailresponsable?.toLowerCase();
                const manager = managerEmail ? emailToNodeMap[managerEmail] : undefined;

                if (manager && manager !== node) {
                    manager.children = manager.children || [];
                    manager.children.push(node);
                } else {
                    rootNodes.push(node);
                }
            });

            rootNodes.forEach(node => {
                const treeNode = this.createNode(node);
                this.container.appendChild(treeNode);
            });

            // this.container.innerText += ` (${rootNodes.length} nœuds racines trouvés)`;
            // this.container.innerText += "\n" + JSON.stringify(rootNodes, null, 4);
        } catch {
            this.container.innerText = "Erreur de parsing JSON." + JSON.stringify(rawData);
        }
    }

    private getNodes(email: string, nodes: HierarchyNode[]): HierarchyNode | undefined {
        return nodes.find(node => node.emailcollaborateur.toLowerCase() === email.toLowerCase());
    }

    private createNode(node: HierarchyNode): HTMLElement {
        const div = document.createElement("div");
        div.classList.add("tree-node");
        // div.style.marginLeft = `${node.children?.length > 0 ? 10 : 0}px`;
        // div.style.paddingLeft = `${node.children?.length > 0 ? 20 : 0}px`;

        const label = document.createElement("div");
        label.classList.add("tree-label");
        label.innerText = `${node.nom} ${node.prenom} (${node.nomresponsable})`;
        label.onclick = () => div.classList.toggle("collapsed");
        div.appendChild(label);

        if (node.children?.length > 0) {
            const childrenContainer = document.createElement("div");
            childrenContainer.classList.add("tree-children");
            childrenContainer.style.paddingLeft = `${node.children?.length > 0 ? 50 : 0}px`;
            node.children.forEach(child => childrenContainer.appendChild(this.createNode(child)));
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