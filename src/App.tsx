import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />{" "}
        //Homeコンポーネントのルーティング設定
        <Route path="/login" element={<Login />} />
        //Loginコンポーネントのルーティング設定
        <Route path="/register" element={<Register />} />
        //Registerコンポーネントのルーティング設定
      </Routes>
    </>
  );
}

export default App;
