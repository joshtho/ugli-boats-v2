import data from '@/assets/data'

function BuildPage() {

//   useEffect(() => {
//   fetch('http://localhost:3001/')
//     .then(res => res.text())
//     .then(data => console.log(data));
// }, []);
const images = data.builds.flatMap(build => build.images)
console.log(images)


  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold">BuildPage</h1>
      {images.map((image, idx) => (
        <img key={idx} src={image.url} alt={image.alt} />
      ))}
    </div>
  )
}

export default BuildPage