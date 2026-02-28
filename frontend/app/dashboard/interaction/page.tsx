import { Params } from 'next/dist/server/request/params'
import { NetworkGraph } from './_components/network-work'
import testData from "./testData.json"

const page = async () => {
  const data = testData.data
  const res = await fetch(process.env.BASE_URL + "/neo4j/patient/PFID_A_6436", { next: { revalidate: 90 } }).then(data => data.json())
  return (
    <div>
      <NetworkGraph data={res.data ? res.data : data} />
    </div>
  )
}

export default page
