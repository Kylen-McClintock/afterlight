"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, UserPlus, Search, Mail, Phone, Tag, Edit2, Trash2, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

export default function ConnectionsPage() {
    const [contacts, setContacts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchContacts()
    }, [])

    const fetchContacts = async () => {
        setLoading(true)
        const supabase = createClient()
        // Get current user's circle (assuming single circle for MVP or picking first)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // First find circle
        const { data: membership } = await supabase
            .from('circle_memberships')
            .select('circle_id')
            .eq('user_id', user.id)
            .single()

        if (membership) {
            const { data } = await supabase
                .from('contacts')
                .select('*')
                .eq('circle_id', membership.circle_id)
                .order('first_name')

            if (data) setContacts(data)
        }
        setLoading(false)
    }

    const filteredContacts = contacts.filter(c =>
        c.first_name.toLowerCase().includes(search.toLowerCase()) ||
        c.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Connections</h1>
                    <p className="text-muted-foreground">Manage your friends, family, and network.</p>
                </div>
                <div className="flex gap-2">
                    <ImportDialog onSuccess={fetchContacts} />
                    <AddContactDialog onSuccess={fetchContacts} />
                </div>
            </div>

            <div className="flex items-center space-x-2 bg-background border rounded-md px-3 h-10 w-full max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Search people..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
            ) : filteredContacts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/5">
                    <h3 className="text-lg font-medium">No connections yet</h3>
                    <p className="text-muted-foreground mb-4">Start simply by adding important people in your life.</p>
                    <AddContactDialog onSuccess={fetchContacts} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredContacts.map(contact => (
                        <ContactCard key={contact.id} contact={contact} onUpdate={fetchContacts} />
                    ))}
                </div>
            )}
        </div>
    )
}

function ContactCard({ contact, onUpdate }: { contact: any, onUpdate: () => void }) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {contact.first_name[0]}{contact.last_name?.[0]}
                        </div>
                        <div>
                            <h3 className="font-semibold leading-tight">{contact.first_name} {contact.last_name}</h3>
                            <p className="text-xs text-muted-foreground">{contact.relationship || "Contact"}</p>
                        </div>
                    </div>
                    <EditContactDialog contact={contact} onSuccess={onUpdate} />
                </div>

                <div className="space-y-2 text-sm">
                    {contact.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{contact.email}</span>
                        </div>
                    )}
                    {contact.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{contact.phone}</span>
                        </div>
                    )}
                </div>

                {contact.access_tags && contact.access_tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                        {contact.access_tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] h-5 px-1.5">{tag}</Badge>
                        ))}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t flex justify-end">
                    <AddToPlanButton connectionId={contact.id} />
                </div>
            </CardContent>
        </Card>
    )
}

function AddToPlanButton({ connectionId }: { connectionId: string }) {
    const [loading, setLoading] = useState(false)

    const addToPlan = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Find active plan
        const { data: plan } = await supabase
            .from('weekly_plans')
            .select('id')
            .eq('user_id', user?.id)
            .eq('is_active', true)
            .limit(1)
            .single()

        if (plan) {
            await supabase.from('weekly_plan_items').insert({
                plan_id: plan.id,
                item_type: 'connection',
                connection_id: connectionId,
                status: 'pending'
            })
            alert("Added to your weekly plan!")
        } else {
            alert("No active weekly plan found.")
        }
        setLoading(false)
    }

    return (
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={addToPlan} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
            Add to Plan
        </Button>
    )
}

function AddContactDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        relationship: "",
        phone: ""
    })

    const handleSubmit = async () => {
        if (!formData.first_name) return
        setLoading(true)
        const supabase = createClient()

        // Get Circle ID
        const { data: { user } } = await supabase.auth.getUser()
        const { data: membership } = await supabase.from('circle_memberships').select('circle_id').eq('user_id', user?.id).single()

        if (membership) {
            const { error } = await supabase.from('contacts').insert({
                circle_id: membership.circle_id,
                ...formData
            })
            if (error) alert("Error creating contact")
            else {
                setOpen(false)
                setFormData({ first_name: "", last_name: "", email: "", relationship: "", phone: "" })
                onSuccess()
            }
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Manual
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add New Contact</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>First Name *</Label>
                            <Input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Relationship</Label>
                        <Input
                            value={formData.relationship}
                            onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                            placeholder="e.g. Daughter, Lawyer, Doctor"
                        />
                    </div>
                    <Button onClick={handleSubmit} disabled={loading || !formData.first_name}>
                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Save Contact
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function EditContactDialog({ contact, onSuccess }: { contact: any, onSuccess: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        notes: contact.notes || "",
        tags: contact.access_tags ? contact.access_tags.join(", ") : ""
    })

    const handleSave = async () => {
        setLoading(true)
        const supabase = createClient()

        // Parse tags
        const tagsArray = formData.tags.split(",").map((t: string) => t.trim()).filter(Boolean)

        const { error } = await supabase
            .from('contacts')
            .update({
                notes: formData.notes,
                access_tags: tagsArray
            })
            .eq('id', contact.id)

        if (error) alert("Error updating")
        else {
            setOpen(false)
            onSuccess()
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Details: {contact.first_name}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Private Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Add details about this person..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Access Tags (comma separated)</Label>
                        <Input
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="e.g. executor, medical, vip"
                        />
                        <p className="text-[10px] text-muted-foreground">Used for permissions later (e.g. 'executor' access)</p>
                    </div>
                    <Button onClick={handleSave} disabled={loading}>Save Details</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ImportDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    const handleImport = async () => {
        if (!file) return
        setLoading(true)

        const text = await file.text()
        const rows = text.split("\n").filter(Boolean)
        // Assume Header: First Name, Last Name, Email, Relationship
        // Skip header if detected (simple check)
        const startIdx = rows[0].toLowerCase().includes("first") ? 1 : 0

        const contactsToInsert = []

        // Get Circle ID
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { data: membership } = await supabase.from('circle_memberships').select('circle_id').eq('user_id', user?.id).single()

        if (!membership) {
            setLoading(false)
            return
        }

        for (let i = startIdx; i < rows.length; i++) {
            const cols = rows[i].split(",").map(c => c.trim())
            if (cols.length < 1) continue
            // Basic mapping
            contactsToInsert.push({
                circle_id: membership.circle_id,
                first_name: cols[0],
                last_name: cols[1] || "",
                email: cols[2] || "",
                relationship: cols[3] || "Imported"
            })
        }

        if (contactsToInsert.length > 0) {
            const { error } = await supabase.from('contacts').insert(contactsToInsert)
            if (error) {
                console.error(error)
                alert("Error importing some contacts")
            } else {
                alert(`Imported ${contactsToInsert.length} contacts!`)
                setOpen(false)
                onSuccess()
            }
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Import Contacts</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Upload a CSV file with columns: <b>First Name, Last Name, Email, Relationship</b>.
                    </p>
                    <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
                    <Button onClick={handleImport} disabled={loading || !file} className="w-full">
                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Import
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
