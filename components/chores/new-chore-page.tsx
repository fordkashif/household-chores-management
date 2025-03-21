"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { SimpleDatePickerV2 } from "@/components/ui/simple-date-picker-v2"
import { useChores } from "@/contexts/chores-context"
import { useToast } from "@/hooks/use-toast"
import { useUsers } from "@/contexts/users-context"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Chore name must be at least 2 characters.",
  }),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters.",
  }),
  frequency: z.string({
    required_error: "Please select a frequency.",
  }),
  assignedTo: z.string({
    required_error: "Please select a family member.",
  }),
  dueDate: z.date({
    required_error: "Please select a due date.",
  }),
  priority: z
    .string({
      required_error: "Please select a priority level.",
    })
    .default("medium"),
})

export function NewChorePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addChore } = useChores()
  const { users } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      frequency: "",
      assignedTo: "",
      dueDate: undefined,
      priority: "medium",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    // Find the assigned user
    const assignedUser = users.find((user) => user.id.toString() === values.assignedTo)

    if (!assignedUser) {
      toast({
        title: "Error",
        description: "Selected user not found.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Add the new chore
    const newChore = addChore({
      name: values.name,
      description: values.description,
      frequency: values.frequency,
      dueDate: values.dueDate.toISOString().split("T")[0],
      assignedTo: {
        name: assignedUser.name,
        avatar: assignedUser.avatar || "/placeholder.svg",
        initials: assignedUser.initials || assignedUser.name.substring(0, 2).toUpperCase(),
      },
      priority: values.priority,
    })

    // Show success toast
    toast({
      title: "Chore added",
      description: `${values.name} has been added successfully.`,
      action: (
        <Button variant="outline" size="sm" onClick={() => router.push(`/chores`)}>
          View All
        </Button>
      ),
    })

    // Navigate back to chores page
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/chores")
    }, 500)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/chores">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chores
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Add New Chore</h1>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Chore Details</CardTitle>
            <CardDescription>Enter the details for the new chore</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chore Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter chore name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter chore description" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Daily">Daily</SelectItem>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                              <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select family member" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Chore
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>
    </div>
  )
}

