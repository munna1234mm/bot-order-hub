import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Plus, Package, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  command: string;
  name: string;
  description: string;
  credits: number;
  duration: string;
  isActive: boolean;
}

// Static services list - in a real app this would come from database
const defaultServices: Service[] = [
  {
    id: '1',
    command: '/canva_pro',
    name: 'Canva Pro',
    description: 'Canva Pro 12 month subscription',
    credits: 5,
    duration: '12 months',
    isActive: true,
  },
];

export const ServicesPanel = () => {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({
    command: '',
    name: '',
    description: '',
    credits: 5,
    duration: '12 months',
    isActive: true,
  });

  const handleAddService = () => {
    if (!newService.command || !newService.name) {
      toast.error('Command and name are required');
      return;
    }

    const service: Service = {
      ...newService,
      id: Date.now().toString(),
      command: newService.command.startsWith('/') ? newService.command : `/${newService.command}`,
    };

    setServices([...services, service]);
    setNewService({
      command: '',
      name: '',
      description: '',
      credits: 5,
      duration: '12 months',
      isActive: true,
    });
    setIsAdding(false);
    toast.success('Service added successfully');
  };

  const handleUpdateService = (id: string, updates: Partial<Service>) => {
    setServices(services.map(s => s.id === id ? { ...s, ...updates } : s));
    setEditingId(null);
    toast.success('Service updated');
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
    toast.success('Service deleted');
  };

  const toggleActive = (id: string) => {
    setServices(services.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Services & Commands
            <Badge variant="outline" className="ml-2">{services.length} services</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(!isAdding)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {isAdding && (
            <div className="mb-4 p-4 rounded-lg border border-border bg-muted/30 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Command</Label>
                  <Input
                    placeholder="/command_name"
                    value={newService.command}
                    onChange={(e) => setNewService({ ...newService, command: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input
                    placeholder="Service Name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Service description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Credits Cost</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={newService.credits}
                    onChange={(e) => setNewService({ ...newService, credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    placeholder="12 months"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddService} className="gap-1">
                  <Save className="h-4 w-4" />
                  Save Service
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsAdding(false)} className="gap-1">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[300px] pr-4">
            {services.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No services configured yet
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-mono">
                            {service.command}
                          </code>
                          <span className="font-medium">{service.name}</span>
                          {service.isActive ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-primary font-medium">{service.credits} credits</span>
                          <span className="text-muted-foreground">• {service.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() => toggleActive(service.id)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p><strong>Note:</strong> To make new services work with the Telegram bot, you'll need to add the command handling logic to the webhook function. Currently, only Canva Pro is fully integrated.</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
