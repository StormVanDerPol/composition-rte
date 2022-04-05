import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";

const InputCapture = () => {
  const ref = useRef();
  const [event, setEvent] = useState(null);

  const [isComposing, setIsComposing] = useState(false);

  const compositionHandler = useCallback((e) => {
    const { type } = e;

    console.log("COMPOSITION HANDLER", e);

    switch (type) {
      case "compositionstart": {
        setIsComposing(true);
        break;
      }
      case "compositionend": {
        setIsComposing(false);
        setTimeout(() => (ref.current.value = ""));

        break;
      }
    }
  }, []);

  return (
    <>
      <textarea
        ref={ref}
        onChange={console.log}
        onCompositionStart={compositionHandler}
        onCompositionEnd={compositionHandler}
      />
      <pre style={{ background: "black", color: "white" }}>
        {JSON.stringify(event, null, 4)}
        {"\n----\n"}
        isComposing = {JSON.stringify(isComposing)}
      </pre>
    </>
  );
};

export default InputCapture;
