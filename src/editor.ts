import rfdc from "rfdc";

type TextNode = {
  text: string;
};

type ElementNode = {
  type: string;
  children: Node[];
};

type Node = ElementNode | TextNode;

type NodeList = Node[];

type Editor = {
  root: HTMLElement;
  inputCapture: HTMLTextAreaElement;
  editorElement: HTMLDivElement;
  isComposing: Boolean;
  operations: Operation[];
  value: NodeList;
  apply: (operation: Operation) => void;
  render: () => void;
  debug: () => void;
  findNode: (path: Path) => Node;
};

type Path = number[];

type Selection = {
  focus: { path: Path; offset: number };
  anchor: { path: Path; offset: number };
};

type Operation = {
  type: "insertText" | "removeText";
  data: string;
  selection: Selection;
};

const defaultValue: NodeList = [
  {
    type: "paragraph",
    children: [{ text: "me gusta mucho!!!!" }, { text: " la playa" }],
  },
  {
    type: "paragraph",
    children: [
      { text: "another paragraph" },
      { text: " text go =><= there :333" },
    ],
  },
];

const deepClone = rfdc();

const isText = (node: Node) => {
  return "text" in node && !("children" in node);
};

const isElement = (node: Node) => {
  return "type" in node && "children" in node;
};

function debug() {
  const { root } = this;

  const debugInfo = document.createElement("pre");
  debugInfo.style.backgroundColor = "#000";
  debugInfo.style.color = "#fff";
  debugInfo.style.whiteSpace = "pre-wrap";
  root.appendChild(debugInfo);

  setInterval(() => {
    const { isComposing, operations, value } = this;
    debugInfo.innerText = JSON.stringify(
      { isComposing, operations, value },
      null,
      4
    );
  }, 1000);
}

function findNode(path: Path) {
  function findNodeRecursive(currentPath: Path, currentValue: NodeList) {
    const level = currentPath.shift();

    const node = currentValue[level];

    if (currentPath.length === 0) return node;

    if ("text" in node) return node;
    if ("children" in node)
      return findNodeRecursive(currentPath, (node as ElementNode).children);

    if (!Array.isArray(node)) throw new Error("it's a secret to everybody");

    return findNodeRecursive(currentPath, currentValue);
  }

  const mutablePath = deepClone(path);

  console.log("waa", this.value);

  return findNodeRecursive(mutablePath, this.value);
}

function apply(operation: Operation) {
  console.log("APPLYING OPERATION", operation);

  if (operation.type === "insertText") {
    const { selection, data } = operation;

    if (!data) return; // skip this one

    const { focus } = selection;
    const { path, offset } = focus;

    console.log(this.value, path);

    const node: Node = this.findNode(path); // <--- still mutable

    if (!isText(node)) throw new Error("[insertText]: not a text node");

    const text = (node as TextNode).text;

    (node as TextNode).text = `${text.slice(0, offset)}${data}${text.slice(
      offset
    )}`;

    console.log(node);
  }

  this.operations.push(operation);
  this.render();
}

function render() {
  function renderRecursive(nodeList: NodeList): string {
    return nodeList
      .map((node: Node) => {
        if (isText(node)) return (node as TextNode).text;
        if (isElement(node))
          return `<div>${renderRecursive(
            (node as ElementNode).children
          )}</div>`;
        return "";
      })
      .join("");
  }

  const markupstring: string = renderRecursive(this.value);

  (this as Editor).editorElement.innerHTML = markupstring;
}

const captureCompositionStart = (editor: Editor) => {
  editor.inputCapture.addEventListener("compositionstart", (e) => {
    console.log(e);
    editor.isComposing = true;
  });
};

const captureCompositionEnd = (editor: Editor) => {
  const { inputCapture, operations } = editor;

  inputCapture.addEventListener("compositionend", (e) => {
    console.log(e);
    editor.isComposing = false;
    inputCapture.value = "";

    const { data } = e;

    editor.apply({
      data,
      type: "insertText",
      selection: {
        focus: { path: [1, 1], offset: " text go =>".length },
        anchor: { path: [1, 1], offset: " text go =>".length },
      },
    });
  });
};

export const createEditor = (root: HTMLElement) => {
  const inputCapture = document.createElement("textarea");
  const editorElement = document.createElement("div");

  root.appendChild(inputCapture);
  root.appendChild(editorElement);

  const editor: Editor = {
    root,
    editorElement,
    inputCapture,
    isComposing: false,
    operations: [],
    value: defaultValue,
    debug: (...args) => debug.call(editor, ...args),
    apply: (...args) => apply.call(editor, ...args),
    render: (...args) => render.call(editor, ...args),
    findNode: (...args) => findNode.call(editor, ...args),
  };

  captureCompositionStart(editor);
  captureCompositionEnd(editor);

  editor.render();

  return editor;
};
