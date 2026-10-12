const technologySymbols: Record<string, string> = {
  Python: "python",
  Java: "coffee",
  C: "c",
  "C++": "cplusplus",
  R: "r",
  Julia: "julia",
  SQL: "database",
  Bash: "gnubash",
  PyTorch: "pytorch",
  TensorFlow: "tensorflow",
  LlamaIndex: "network",
  spaCy: "spacy",
  LangChain: "langchain",
  FAISS: "database",
  "Hugging Face": "huggingface",
  "scikit-learn": "scikitlearn",
  Pandas: "pandas",
  NumPy: "numpy",
  MLflow: "mlflow",
  Optuna: "optuna",
  statsmodels: "chart",
  SciPy: "scipy",
  OpenCV: "opencv",
  YOLO: "yolo",
  MediaPipe: "mediapipe",
  Roboflow: "roboflow",
  "Vision Transformers": "vision",
  SHAP: "chart",
  LIME: "chart",
  React: "react",
  "Node.js": "nodedotjs",
  "Spring Boot": "springboot",
  Flask: "flask",
  Streamlit: "streamlit",
  FastAPI: "fastapi",
  Linux: "linux",
  Git: "git",
  Docker: "docker",
  Neo4j: "neo4j",
  Unity: "unity",
  Godot: "godotengine",
  MATLAB: "engineering",
  CATIA: "engineering",
  AutoCAD: "autocad",
  QGIS: "qgis",
  Neovim: "neovim",
};

export function TechnologyIcon({ name }: { name: string }) {
  const symbol = technologySymbols[name] ?? "code";
  return (
    <svg
      className="technology-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <use href={`/icons/stack.svg#${symbol}`} />
    </svg>
  );
}
