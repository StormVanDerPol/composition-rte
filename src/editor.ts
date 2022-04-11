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
  selection: Selection;
  apply: (operation: Operation) => void;
  render: () => void;
  debug: () => void;
  findNode: (path: Path) => Node;
  start: () => { node: Node; path: Path };
  end: () => { node: Node; path: Path };
};

type Path = number[];

type Selection = {
  focus: { path: Path; offset: number };
  anchor: { path: Path; offset: number };
};

enum ops {
  INSERT_TEXT,
  REMOVE_TEXT,
  SET_SELECTION,
}

type Operation = {
  type: ops;
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

// gets first text node + path
function start() {
  const findStart = (nodeList: NodeList, path: Path) => {
    for (const [index, node] of nodeList.entries()) {
      path.push(index);

      if (isElement(node))
        return findStart((node as ElementNode).children, path);
      if (isText(node)) return { node, path };

      throw new Error("Hell the what?");
    }
  };

  return findStart(this.value, []);
}

// gets last text node + path
function end() {
  const findEnd = (nodeList: NodeList, path: Path) => {
    for (const reversedIndex in nodeList) {
      const index = nodeList.length - 1 - Number(reversedIndex);

      const node = nodeList[index];

      path.push(index);

      if (isElement(node)) return findEnd((node as ElementNode).children, path);
      if (isText(node)) return { node, path };

      throw new Error("Hell the what?");
    }
  };

  return findEnd(this.value, []);
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

  return findNodeRecursive(mutablePath, this.value);
}

function apply(operation: Operation) {
  console.log("APPLYING OPERATION", operation);

  if (operation.type === ops.INSERT_TEXT) {
    let { selection, data } = operation;

    if (!data) return; // skip this one
    if (!selection) selection = this.selection;

    const { focus } = selection;
    const { path, offset } = focus;

    const node: Node = this.findNode(path); // <--- still mutable

    if (!isText(node)) throw new Error("[insertText]: not a text node");

    const text = (node as TextNode).text;

    (node as TextNode).text = `${text.slice(0, offset)}${data}${text.slice(
      offset
    )}`;
  } else if (operation.type === ops.SET_SELECTION) {
    const { selection } = operation;

    if (!selection) throw new Error("No selection provided to set selection");

    this.selection = selection;
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

/* dom event capturing */

const captureCompositionStart = (editor: Editor) => {
  editor.inputCapture.addEventListener("compositionstart", (e) => {
    editor.isComposing = true;
  });
};

const captureCompositionEnd = (editor: Editor) => {
  const { inputCapture } = editor;

  inputCapture.addEventListener("compositionend", (e) => {
    editor.isComposing = false;
    inputCapture.value = "";

    const { data } = e;

    console.log("start: ", editor.start());
    console.log("end: ", editor.end());

    editor.apply({
      data,
      type: ops.INSERT_TEXT,
      selection: editor.selection,
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
    selection: null,
    debug: (...args) => debug.call(editor, ...args),
    apply: (...args) => apply.call(editor, ...args),
    render: (...args) => render.call(editor, ...args),
    findNode: (...args) => findNode.call(editor, ...args),
    start: (...args) => start.call(editor, ...args),
    end: (...args) => end.call(editor, ...args),
  };

  captureCompositionStart(editor);
  captureCompositionEnd(editor);

  editor.apply({
    type: ops.SET_SELECTION,
    data: "",
    selection: {
      anchor: { path: editor.start().path, offset: 0 },
      focus: { path: editor.start().path, offset: 0 },
    },
  });

  editor.render();

  return editor;
};
