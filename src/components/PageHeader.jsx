// define PageHeader, which receives props
function PageHeader(props) {
  // read the title from props
  const titleText = props.title;
  // read the subtitle from props
  const subtitleText = props.subtitle;
  // return the header
  return (
    <header className="page-header">
      {/* show the title */}
      <h1>{titleText}</h1>
      {/* show the subtitle */}
      <p>{subtitleText}</p>
    </header>
  );
}

// make PageHeader available to other files
export default PageHeader;
