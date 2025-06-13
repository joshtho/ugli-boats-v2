import { useEffect } from "react";

function BuildPage() {

//   useEffect(() => {
//   fetch('http://localhost:3001/')
//     .then(res => res.text())
//     .then(data => console.log(data));
// }, []);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold">BuildPage</h1>
      <img src='/IMAGES/ugliboat 3 web image.jpg' alt="Ugli Boat" className="w-full h-auto rounded-lg" />
    </div>
  )
}

export default BuildPage