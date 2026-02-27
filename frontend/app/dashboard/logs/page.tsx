import { NetworkGraph } from './_components/network-work'
import testData from "./testData.json"

const page = () => {
  const data = testData.data

  return (
    <div>
      <NetworkGraph data={data} />
    </div>
  )
}

export default page
