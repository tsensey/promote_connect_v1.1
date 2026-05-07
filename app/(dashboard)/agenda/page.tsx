'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEvenements, useRendezVous } from '@/hooks/useAgenda';
import { supabaseClient } from '@/lib/supabase/client';
import { Calendar, Clock, MapPin, Users, Plus, X, Check, AlertCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirme',
  cancelled: 'Annule',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const EVENT_TYPES = ['conference', 'atelier', 'networking', 'keynote', 'panel'];

export default function AgendaPage() {
  const { evenements, loading: eventsLoading } = useEvenements();
  const { rdvs, loading: rdvsLoading, createRdv, updateRdvStatus, cancelRdv } = useRendezVous();
  const [showNewRdv, setShowNewRdv] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [rdvFilter, setRdvFilter] = useState<string>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setMyUserId(data?.session?.user?.id ?? null);
    });
  }, []);

  const filteredEvenements = useMemo(() => {
    return evenements
      .filter((evt) => eventFilter === 'all' || evt.type === eventFilter)
      .filter(
        (evt) =>
          eventSearch === '' ||
          evt.titre.toLowerCase().includes(eventSearch.toLowerCase()) ||
          evt.description?.toLowerCase().includes(eventSearch.toLowerCase())
      );
  }, [evenements, eventFilter, eventSearch]);

  const filteredRdvs = useMemo(() => {
    return rdvs.filter((rdv) => rdvFilter === 'all' || rdv.status === rdvFilter);
  }, [rdvs, rdvFilter]);

  const upcomingRdvs = useMemo(
    () => rdvs.filter((rdv) => rdv.status === 'confirmed' && new Date(rdv.starts_at) >= new Date()),
    [rdvs]
  );

  return (
    <main className="min-h-screen bg-muted px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <Card className="p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Agenda interactif</h1>
              <p className="mt-2 text-slate-600">
                Consultez le programme du salon et gere vos rendez-vous B2B.
              </p>
            </div>
            <Button onClick={() => setShowNewRdv(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Demander un RDV
            </Button>
          </div>

          {upcomingRdvs.length > 0 && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Prochains rendez-vous ({upcomingRdvs.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {upcomingRdvs.slice(0, 3).map((rdv) => (
                  <div key={rdv.id} className="flex items-center gap-3 rounded-md bg-white px-4 py-2 shadow-sm">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-xs font-medium text-blue-700">
                        {rdv.other_user?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{rdv.other_user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(rdv.starts_at).toLocaleDateString('fr-FR')} a{' '}
                        {new Date(rdv.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue="programme" className="mt-4">
            <TabsList>
              <TabsTrigger value="programme">Programme</TabsTrigger>
              <TabsTrigger value="rdvs">Mes rendez-vous</TabsTrigger>
            </TabsList>

            <TabsContent value="programme" className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Rechercher un evenement..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={eventFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventFilter('all')}
                  >
                    Tous
                  </Button>
                  {EVENT_TYPES.map((type) => (
                    <Button
                      key={type}
                      variant={eventFilter === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEventFilter(type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {eventsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredEvenements.length === 0 ? (
                <div className="rounded-lg border border-border bg-white p-4 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-muted-foreground">Aucun evenement ne correspond a votre recherche.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredEvenements.map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-lg border border-border bg-white p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{evt.titre}</h3>
                            {evt.type && (
                              <Badge variant="secondary">{evt.type}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{evt.description}</p>
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {evt.pavillon && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Pavillon {evt.pavillon}
                              </span>
                            )}
                            {evt.salle && (
                              <span className="flex items-center gap-1">
                                Salle {evt.salle}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground flex-shrink-0 ml-4">
                          <p className="flex items-center gap-1 justify-end">
                            <Calendar className="h-3 w-3" />
                            {new Date(evt.starts_at).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="font-semibold text-slate-900 flex items-center gap-1 justify-end mt-1">
                            <Clock className="h-3 w-3" />
                            {new Date(evt.starts_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            a{' '}
                            {new Date(evt.ends_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rdvs" className="mt-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={rdvFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRdvFilter(status)}
                  >
                    {status === 'all' ? 'Tous' : STATUS_LABELS[status]}
                    {status !== 'all' && (
                      <span className="ml-1 text-xs opacity-70">
                        ({rdvs.filter((r) => r.status === status).length})
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {rdvsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filteredRdvs.length === 0 ? (
                <div className="rounded-lg border border-border bg-white p-4 text-center">
                  <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-muted-foreground">Aucun rendez-vous pour le moment.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredRdvs.map((rdv) => (
                    <div
                      key={rdv.id}
                      className="rounded-lg border border-border bg-white p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
                              {rdv.other_user?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900">{rdv.other_user?.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(rdv.starts_at).toLocaleDateString('fr-FR')} a{' '}
                              {new Date(rdv.starts_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {rdv.notes && (
                              <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{rdv.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={STATUS_COLORS[rdv.status || 'pending']}>{STATUS_LABELS[rdv.status || 'pending']}</Badge>
                          {rdv.status === 'pending' && rdv.destinataire_id === myUserId && (
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full bg-green-100 text-green-700 hover:bg-green-200 border-none"
                                onClick={() => {
                                  updateRdvStatus(rdv.id, 'confirmed').then(() =>
                                    toast.success('RDV confirme')
                                  );
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7 rounded-full bg-red-100 text-red-700 hover:bg-red-200 border-none"
                                onClick={() => {
                                  cancelRdv(rdv.id).then(() => toast.info('RDV annule'));
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {rdv.status === 'confirmed' && new Date(rdv.starts_at) > new Date() && (
                            <Button
                              variant="link"
                              size="sm"
                              className="ml-2 text-xs text-red-600 hover:text-red-700 p-0 h-auto"
                              onClick={() => {
                                cancelRdv(rdv.id).then(() => toast.info('RDV annule'));
                              }}
                            >
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <NewRdvDialog open={showNewRdv} onOpenChange={setShowNewRdv} onCreate={createRdv} />
    </main>
  );
}

function NewRdvDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (destinataireId: string, startsAt: string, endsAt: string, notes?: string) => Promise<unknown>;
}) {
  const [destinataireId, setDestinataireId] = useState('');
  const [date, setDate] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<
    { id: string; full_name: string | null; company: string | null }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDestinataireId('');
      setDate('');
      setTimeStart('');
      setTimeEnd('');
      setNotes('');
      setSearchQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fetchContacts = async () => {
      const { data } = await supabaseClient
        .from('profiles')
        .select('id, full_name, company')
        .ilike('full_name', `%${searchQuery}%`)
        .limit(20);
      if (data) setContacts(data);
    };
    fetchContacts();
  }, [open, searchQuery]);

  const handleSubmit = async () => {
    if (!destinataireId || !date || !timeStart || !timeEnd) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      const startsAt = new Date(`${date}T${timeStart}`).toISOString();
      const endsAt = new Date(`${date}T${timeEnd}`).toISOString();
      await onCreate(destinataireId, startsAt, endsAt, notes || undefined);
      toast.success('Demande de RDV envoyee');
      onOpenChange(false);
    } catch {
      toast.error('Erreur lors de la creation du RDV');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demander un rendez-vous B2B</DialogTitle>
          <DialogDescription>
            Selectionnez un contact et choisissez un creneau horaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Contact</Label>
            <Input
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDestinataireId('');
              }}
            />
            {contacts.length > 0 && !destinataireId && (
              <div className="max-h-32 overflow-y-auto space-y-1 mt-2">
                {contacts.map((c) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 rounded-md hover:bg-muted text-sm"
                    onClick={() => {
                      setDestinataireId(c.id);
                      setSearchQuery(c.full_name || '');
                    }}
                  >
                    <span className="font-medium">{c.full_name || 'Contact'}</span>
                    {c.company && <span className="text-muted-foreground ml-2">— {c.company}</span>}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Heure debut</Label>
              <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Heure fin</Label>
              <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Sujet du rendez-vous, points a aborder..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Envoi...' : 'Envoyer la demande'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
