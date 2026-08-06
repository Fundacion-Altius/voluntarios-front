import { isDevelopment } from '@/lib/utils'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'Performance and usage analytics',
}

export default function AnalyticsDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      
      {isDevelopment() ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            Analytics dashboard is only available in production/staging environments.
            In development, you can view collected events at <code>/api/analytics</code>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600">Average Page Load</p>
                <p className="text-2xl font-bold">1.2s</p>
              </div>
              <div>
                <p className="text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-red-600">0.5%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Activity</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600">Active Users (24h)</p>
                <p className="text-2xl font-bold">42</p>
              </div>
              <div>
                <p className="text-gray-600">Page Views (24h)</p>
                <p className="text-2xl font-bold">187</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
            <div className="space-y-2">
              <div className="text-sm text-red-600">
                <p>TypeError: Cannot read property &#39;map&#39; of undefined</p>
                <p className="text-xs text-gray-500">1 hour ago • ContractPage</p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Page Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Page</th>
                    <th className="text-left p-2">Avg Load Time</th>
                    <th className="text-left p-2">Views</th>
                    <th className="text-left p-2">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">/</td>
                    <td className="p-2">1.4s</td>
                    <td className="p-2">45</td>
                    <td className="p-2">1</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">/encuesta</td>
                    <td className="p-2">2.1s</td>
                    <td className="p-2">32</td>
                    <td className="p-2">0</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">/dashboard</td>
                    <td className="p-2">1.8s</td>
                    <td className="p-2">28</td>
                    <td className="p-2">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}