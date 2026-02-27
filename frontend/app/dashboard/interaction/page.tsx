import { NetworkGraph } from './_components/network-work'
import testData from "./testData.json"

const page = async () => {
  const data = testData.data
  const res = await fetch(process.env.BASE_URL + "/neo4j/patient/PFID_A_6436").then(data => data.json())
  console.log(res)
  return (
    <div>
      <NetworkGraph data={res.data ? res.data : data} />
    </div>
  )
}

export default page
