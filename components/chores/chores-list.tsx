"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge-custom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { SimpleDatePickerV2 } from "@/components/ui/simple-date-picker-v2"
import { useChores, type Chore } from "@/contexts/chores-context"
import { useUsers } from "@/contexts/users-context"

// Form schema for editing chores
const editChoreSchema = z.object({
  name: z.string().min(2, {
    message: "Chore name must be at least 2 characters.",
  }),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  frequency: z.string({
    required_error: "Please select a frequency.",
  }),
  status: z.string({
    required_error: "Please select a status.",
  }),
  dueDate: z.date({
    required_error: "Please select a due date.",
  }),
  priority: z.string().optional(),
})

export function ChoresList() {
  const { toast } = useToast()
  const { chores, updateChore, deleteChore } = useChores()
  const { users } = useUsers()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Current chore being edited/reassigned/deleted
  const [currentChore, setCurrentChore] = useState<Chore | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null)

  // Edit form
  const editForm = useForm<z.infer<typeof editChoreSchema>>({
    resolver: zodResolver(editChoreSchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: "",
      status: "",
      dueDate: undefined,
      priority: "medium",
    },
  })

  // Filter chores based on search term and status
  const filteredChores = chores.filter((chore) => {
    const matchesSearch =
      chore.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chore.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || chore.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Handle edit chore
  const handleEditChore = (chore: Chore) => {
    setCurrentChore({ ...chore })
    setSelectedChore({ ...chore })

    // Set form values
    editForm.reset({
      name: chore.name,
      description: chore.description,
      frequency: chore.frequency,
      status: chore.status,
      dueDate: new Date(chore.dueDate),
      priority: chore.priority,
    })

    setIsEditModalOpen(true)
  }

  // Handle save edited chore
  const handleSaveEdit = (values: z.infer<typeof editChoreSchema>) => {
    if (!currentChore) return

    const updatedChore = {
      ...currentChore,
      name: values.name,
      description: values.description,
      frequency: values.frequency,
      status: values.status,
      dueDate: values.dueDate.toISOString().split("T")[0],
      priority: values.priority || currentChore.priority,
    }

    updateChore(currentChore.id, updatedChore)

    toast({
      title: "Chore updated",
      description: `${values.name} has been updated successfully.`,
    })

    // Reset states
    setIsEditModalOpen(false)
    setCurrentChore(null)
    editForm.reset()
  }

  // Handle reassign chore
  const handleReassignChore = (chore: Chore) => {
    setCurrentChore({ ...chore })
    // Find the current user ID
    const currentUserId = users.find((user) => user.name === chore.assignedTo.name)?.id.toString() || ""
    setSelectedUserId(currentUserId)
    setIsReassignModalOpen(true)
  }

  // Handle save reassignment
  const handleSaveReassign = () => {
    if (!currentChore || !selectedUserId) return

    const selectedUser = users.find((user) => user.id.toString() === selectedUserId)

    if (!selectedUser) return

    const updatedChore = {
      ...currentChore,
      assignedTo: {
        name: selectedUser.name,
        avatar: selectedUser.avatar,
        initials: selectedUser.initials,
      },
    }

    updateChore(currentChore.id, updatedChore)

    toast({
      title: "Chore reassigned",
      description: `${updatedChore.name} has been reassigned to ${selectedUser.name}.`,
    })

    // Reset states
    setIsReassignModalOpen(false)
    setCurrentChore(null)
    setSelectedUserId("")
  }

  // Handle delete chore
  const handleDeleteChore = (chore: Chore) => {
    setCurrentChore({ ...chore })
    setIsDeleteModalOpen(true)
  }

  // Add a state to track the last deleted chore for undo functionality
  const [lastDeletedChore, setLastDeletedChore] = useState<Chore | null>(null)

  // Update the handleConfirmDelete function to store the deleted chore and show a toast with undo button
  const handleConfirmDelete = () => {
    if (!currentChore) return

    // Store the chore before deleting it
    setLastDeletedChore({ ...currentChore })

    // Remove the chore from the list
    deleteChore(currentChore.id)

    // Show toast with undo button
    toast({
      title: "Chore deleted",
      description: `${currentChore.name} has been deleted.`,
      variant: "default",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Restore the chore if undo is clicked
            if (lastDeletedChore) {
              // Add the chore back (in a real app, you'd call an API)
              updateChore(lastDeletedChore.id, lastDeletedChore)
              setLastDeletedChore(null)
              toast({
                title: "Chore restored",
                description: `${lastDeletedChore.name} has been restored.`,
              })
            }
          }}
        >
          Undo
        </Button>
      ),
    })

    // Reset states
    setIsDeleteModalOpen(false)
    setCurrentChore(null)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All Chores</CardTitle>
          <CardDescription>Manage and track all household chores</CardDescription>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 mt-4">
            <Input
              placeholder="Search chores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[700px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No chores found. Try adjusting your search or filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChores.map((chore) => (
                    <TableRow key={chore.id}>
                      <TableCell className="font-medium">{chore.name}</TableCell>
                      <TableCell>{chore.frequency}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={chore.assignedTo.avatar} alt={chore.assignedTo.name} />
                            <AvatarFallback>{chore.assignedTo.initials}</AvatarFallback>
                          </Avatar>
                          <span>{chore.assignedTo.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={chore.status === "completed" ? "success" : "warning"}>
                          {chore.status === "completed" ? "Completed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(chore.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            chore.priority === "high"
                              ? "destructive"
                              : chore.priority === "medium"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {chore.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditChore(chore)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReassignChore(chore)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              <span>Reassign</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteChore(chore)}>
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {isEditModalOpen && selectedChore && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setIsEditModalOpen(false)
                setCurrentChore(null)
                editForm.reset()
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>

            <h2 className="text-lg font-semibold mb-4">Edit Chore</h2>
            <p className="text-sm text-muted-foreground mb-4">Make changes to the chore details below.</p>
            <Badge
              variant={
                selectedChore.priority === "high"
                  ? "destructive"
                  : selectedChore.priority === "medium"
                    ? "warning"
                    : "secondary"
              }
              className="ml-2"
            >
              {selectedChore.priority}
            </Badge>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || selectedChore.priority}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <SimpleDatePickerV2
                            date={field.value}
                            setDate={(date) => {
                              field.onChange(date)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setCurrentChore(null)
                      editForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {isReassignModalOpen && currentChore && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => {
                setIsReassignModalOpen(false)
                setCurrentChore(null)
                setSelectedUserId("")
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>

            <h2 className="text-lg font-semibold mb-4">Reassign Chore</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select a new person to assign "{currentChore.name}" to.
            </p>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reassign-user">Assign To</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="reassign-user">
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReassignModalOpen(false)
                  setCurrentChore(null)
                  setSelectedUserId("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveReassign}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentChore && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background border rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-lg font-semibold mb-4">Are you sure?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete the chore "{currentChore.name}". This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setCurrentChore(null)
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

