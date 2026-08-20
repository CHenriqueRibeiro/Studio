export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return res.status(200).json({
    status: 'ok',
    service: 'Fortics Studio API',
    endpoints: ['/api/generate', '/api/health', '/api/simulate-chat']
  });
}
