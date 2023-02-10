export async function postNode(url) {
  return fetch(process.env.PUBLIC_PROFILE_POST_URL + '/nodes-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: `{"profile_url": "${url}"}`
  })
    .then(data => data.json())
    .catch(err => {
      console.log('postNode error: ', err)
      return err
    })
}

export async function getNodeStatus(node_id) {
  return fetch(`${process.env.PUBLIC_PROFILE_POST_URL}/nodes/${node_id}`)
    .then(res => res.json())
    .then(body => body)
    .catch(err => {
      return err
    })
}
