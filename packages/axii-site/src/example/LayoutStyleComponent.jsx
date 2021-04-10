import { createElement } from 'axii'

function Box() {
  return <div style={{background: '#cecece'}}>box</div>
}

export default function Code() {
  return (
    <container>
      <line block>
        <Box layout:inline/>
      </line>
      <line block block-margin-top-10px>
        <Box layout:inline layout:inline-width-300px/>
      </line>
      <line block block-margin-top-10px>
        <Box layout:block/>
      </line>
    </container>
  )
}