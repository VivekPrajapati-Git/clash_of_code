import { Params } from 'next/dist/server/request/params'
import { NetworkGraph } from '../_components/network-work'
// import { testData } from '../testData.json'


const page = async ({ params }: { params: Params }) => {
  // const data = testData.data
  const { id } = await params
  console.log(id)
  const res = await fetch(process.env.BASE_URL + "/neo4j/patient/"+id, { next: { revalidate: 90 } }).then(data => data.json())
  return (
    <div>
      <NetworkGraph data={res.data} />
    </div>
  )
}

export default page
