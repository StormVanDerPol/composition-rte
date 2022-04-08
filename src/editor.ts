type Editor = {
  root: HTMLElement;
  inputCapture: HTMLTextAreaElement;
  editorElement: HTMLDivElement;
  isComposing: Boolean;
  operations: Operation[];
  apply: (operation: Operation) => void;
  debug: () => void;
};

type Operation = {
  type: "insertText" | "removeText";
  data: String;
};

function debug() {
  const { root } = this;

  const debugInfo = document.createElement("pre");
  debugInfo.style.backgroundColor = "#000";
  debugInfo.style.color = "#fff";
  debugInfo.style.whiteSpace = "pre-wrap";
  root.appendChild(debugInfo);

  setInterval(() => {
    const { isComposing, operations } = this;
    debugInfo.innerText = JSON.stringify({ isComposing, operations }, null, 4);
  }, 1000);
}

function apply(operation: Operation) {
  console.log("APPLYING OPERATION", operation);
  this.operations.push(operation);
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

    editor.apply({ data, type: "insertText" });
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
    debug: (...args) => debug.call(editor, ...args),
    apply: (...args) => apply.call(editor, ...args),
  };

  captureCompositionStart(editor);
  captureCompositionEnd(editor);

  return editor;
};
