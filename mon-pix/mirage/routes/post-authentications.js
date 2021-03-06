const simpleUserAuthentication = {
  data: {
    type: 'authentication',
    attributes: {
      'user-id': 1,
      token: 'aaa.eyJ1c2VyX2lkIjoxLCJzb3VyY2UiOiJwaXgiLCJpYXQiOjE1NDUyMTg5MDh9.bbbb'
    },
    id: 1
  }
};

const prescriberAuthentication = {
  data: {
    type: 'authentication',
    attributes: {
      'user-id': 2,
      token: 'aaa.eyJ1c2VyX2lkIjoyLCJzb3VyY2UiOiJwaXgiLCJpYXQiOjE1NDUyMTg4Nzl9.bbbb'
    },
    id: 2
  }
};

const badUser = {
  errors: [
    { status:'400',
      title:'Invalid Payload',
      detail: 'L\'adresse e-mail et/ou le mot de passe saisi(s) sont incorrects.'
    }
  ]
};

export default function(schema, request) {

  const email = JSON.parse(request.requestBody).data.attributes.email;

  if (email === 'jane@acme.com') return simpleUserAuthentication;

  if (email === 'john@acme.com') return prescriberAuthentication;

  return badUser;
}
