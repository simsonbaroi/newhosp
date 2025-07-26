import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Shield, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useTakaFormat } from '../hooks/useCurrencyFormat';

const Dashboard = () => {
  const { format } = useTakaFormat();
  
  const stats = [
    { 
      name: 'Total Bills Today', 
      value: '47', 
      change: '+12%', 
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      name: 'Revenue Today', 
      value: format(156750), 
      change: '+8.2%', 
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      name: 'Active Patients', 
      value: '89', 
      change: '+5', 
      icon: Users,
      color: 'text-medical-600',
      bgColor: 'bg-medical-100'
    },
    { 
      name: 'System Status', 
      value: 'Healthy', 
      change: 'Online', 
      icon: Shield,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
  ];

  const recentActivity = [
    { 
      user: 'Dr. Rahman', 
      action: 'Generated outpatient bill #OP-2025-001', 
      time: '5 min ago',
      type: 'billing'
    },
    { 
      user: 'Nurse Sarah', 
      action: 'Updated inpatient record #IP-2025-012', 
      time: '15 min ago',
      type: 'update'
    },
    { 
      user: 'Admin', 
      action: 'Added new medicine to database', 
      time: '1 hour ago',
      type: 'database'
    },
    { 
      user: 'Dr. Khan', 
      action: 'Processed discharge bill #IP-2025-011', 
      time: '2 hours ago',
      type: 'billing'
    },
  ];

  const systemMetrics = [
    { label: 'Database Items', value: '1,247', status: 'normal' },
    { label: 'Processed Bills', value: '156', status: 'normal' },
    { label: 'Active Sessions', value: '12', status: 'normal' },
    { label: 'Server Uptime', value: '99.9%', status: 'excellent' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.name}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <p className={`mt-1 text-sm flex items-center ${
                      stat.change.includes('+') ? 'text-green-600' : 
                      stat.change.includes('-') ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} rounded-xl p-3`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-medical-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-lg mr-3 ${
                      activity.type === 'billing' ? 'bg-blue-100' :
                      activity.type === 'update' ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      {activity.type === 'billing' ? (
                        <FileText className="w-4 h-4 text-blue-600" />
                      ) : activity.type === 'update' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{activity.user}</p>
                      <p className="text-sm text-gray-600 truncate">{activity.action}</p>
                    </div>
                    <div className="text-xs text-gray-500 ml-2 flex-shrink-0">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-medical-600" />
                System Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-bold mr-2">{metric.value}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        metric.status === 'excellent' ? 'bg-green-500' :
                        metric.status === 'normal' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-medical-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-4 bg-medical-50 rounded-lg hover:bg-medical-100 transition-colors group">
                <div className="bg-medical-100 group-hover:bg-medical-200 p-3 rounded-full mb-2 transition-colors">
                  <FileText className="w-6 h-6 text-medical-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">New Bill</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
                <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-full mb-2 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Patient</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
                <div className="bg-green-100 group-hover:bg-green-200 p-3 rounded-full mb-2 transition-colors">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">View Reports</span>
              </button>
              
              <button className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
                <div className="bg-purple-100 group-hover:bg-purple-200 p-3 rounded-full mb-2 transition-colors">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Settings</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;