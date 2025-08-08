"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Award, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRefModeGuard } from "@/hooks/use-ref-mode-guard"

interface Team {
  team_id: number
  team_name: string
}

interface ExtraPoint {
  id: number
  team_name: string
  point_value: number
  point_type: 'BONUS' | 'PENALTY'
  comments: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  updated_at: string
}

export default function ExtraPointsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [extraPoints, setExtraPoints] = useState<ExtraPoint[]>([])
  const [pendingPoints, setPendingPoints] = useState<ExtraPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null)
  const [refereeComments, setRefereeComments] = useState<{ [key: number]: string }>({})
  const [showCommentInput, setShowCommentInput] = useState<{ [key: number]: boolean }>({})
  const [formData, setFormData] = useState({
    team_id: '',
    point_value: '',
    category: '',
    comments: ''
  })
  const { toast } = useToast()
  const { guardRefModeAsync } = useRefModeGuard()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [teamsRes, extraPointsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extra-points`)
      ])

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData.teams)
      }

      if (extraPointsRes.ok) {
        const extraPointsData = await extraPointsRes.json()
        setExtraPoints(extraPointsData.extraPoints)
        // Filter pending points for referee section
        setPendingPoints(extraPointsData.extraPoints.filter((point: ExtraPoint) => point.status === 'PENDING'))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.team_id || !formData.point_value || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      await guardRefModeAsync(async () => {
        setSubmitting(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extra-points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            team_id: parseInt(formData.team_id),
            point_value: formData.category === 'PENALTY' ? -Math.abs(parseInt(formData.point_value)) : Math.abs(parseInt(formData.point_value)),
            category: formData.category,
            comments: formData.comments || null
          })
        })

        const data = await response.json()

        if (data.success) {
          toast({
            title: "Success",
            description: "Extra point added successfully",
          })
          
          // Reset form
          setFormData({
            team_id: '',
            point_value: '',
            category: '',
            comments: ''
          })
          
          // Refresh data
          fetchData()
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to add extra point",
            variant: "destructive"
          })
        }
      }, "add extra points")
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    return category === 'BONUS' ? (
      <Award className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleStatusUpdate = async (pointId: number, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      await guardRefModeAsync(async () => {
        setUpdatingStatus(pointId)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extra-points`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: pointId,
            status: newStatus,
            refereeComment: refereeComments[pointId] || null
          })
        })

        const data = await response.json()

        if (data.success) {
          toast({
            title: "Success",
            description: `Point ${newStatus.toLowerCase()} successfully`,
          })
          
          // Clear comment input
          setRefereeComments(prev => ({ ...prev, [pointId]: '' }))
          setShowCommentInput(prev => ({ ...prev, [pointId]: false }))
          
          // Refresh data
          fetchData()
        } else {
          toast({
            title: "Error",
            description: data.message || "Failed to update point status",
            variant: "destructive"
          })
        }
      }, "update point status")
    } finally {
      setUpdatingStatus(null)
    }
  }

  const toggleCommentInput = (pointId: number) => {
    setShowCommentInput(prev => ({ ...prev, [pointId]: !prev[pointId] }))
    if (!showCommentInput[pointId]) {
      setRefereeComments(prev => ({ ...prev, [pointId]: '' }))
    }
  }

  const handleCommentChange = (pointId: number, comment: string) => {
    setRefereeComments(prev => ({ ...prev, [pointId]: comment }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }



  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Extra Points</h1>

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Points
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Review
            {pendingPoints.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingPoints.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Add Extra Points Tab */}
        <TabsContent value="add" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Extra Points
              </CardTitle>
              <CardDescription>
                Add bonus or penalty points for teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="team">Team *</Label>
                  <Select 
                    value={formData.team_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, team_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.team_id} value={team.team_id.toString()}>
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        category: value,
                        // Reset point value when category changes
                        point_value: ''
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BONUS">Bonus</SelectItem>
                      <SelectItem value="PENALTY">Penalty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points">Points *</Label>
                  <Input
                    id="points"
                    type="number"
                    placeholder={formData.category === 'PENALTY' ? "Enter penalty points (will be made negative)" : "Enter bonus points"}
                    value={formData.point_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, point_value: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    placeholder="Add any additional comments..."
                    value={formData.comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Adding..." : "Add Extra Points"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Review Tab */}
        <TabsContent value="pending" className="mt-6">
          {pendingPoints.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Pending Points</h3>
                  <p className="text-muted-foreground">
                    All extra points have been reviewed or there are no pending submissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPoints.map((point) => (
                <Card key={point.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(point.point_type)}
                          <span className="font-medium">{point.team_name}</span>
                        </div>
                        {getStatusBadge(point.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-bold ${point.point_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {point.point_value >= 0 ? '+' : ''}{point.point_value} points
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(point.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      {point.comments && (
                        <p className="text-sm text-muted-foreground">
                          {point.comments}
                        </p>
                      )}
                      
                      {/* Comment Input Section */}
                      {showCommentInput[point.id] && (
                        <div className="space-y-2 pt-2">
                          <Textarea
                            placeholder="Add referee comment (optional)..."
                            value={refereeComments[point.id] || ''}
                            onChange={(e) => handleCommentChange(point.id, e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(point.id, 'APPROVED')}
                          disabled={updatingStatus === point.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updatingStatus === point.id ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(point.id, 'REJECTED')}
                          disabled={updatingStatus === point.id}
                        >
                          {updatingStatus === point.id ? "Rejecting..." : "Reject"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCommentInput(point.id)}
                          disabled={updatingStatus === point.id}
                        >
                          {showCommentInput[point.id] ? "Hide Comment" : "Add Comment"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Extra Points History</CardTitle>
              <CardDescription>
                View all extra points entries and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {extraPoints.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Extra Points</h3>
                    <p className="text-muted-foreground">
                      No extra points have been added yet.
                    </p>
                  </div>
                ) : (
                  extraPoints.map((point) => (
                    <div key={point.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(point.point_type)}
                          <span className="font-medium">{point.team_name}</span>
                        </div>
                        {getStatusBadge(point.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-bold ${point.point_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {point.point_value >= 0 ? '+' : ''}{point.point_value} points
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(point.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      {point.comments && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {point.comments}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 