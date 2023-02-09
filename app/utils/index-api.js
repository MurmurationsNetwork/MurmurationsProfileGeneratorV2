export async function getNodeStatus(node_id) {
  return fetch(`${process.env.PUBLIC_PROFILE_POST_URL}/nodes/${node_id}`)
    .then(res => res.json())
    .then(body => body)
    .catch(err => {
      return err
    })
}
