/**
 * Validate task data from CSV import
 */
export function validateTask(task, rowNumber) {
  const errors = []
  
  // Validate week
  const week = parseInt(task.week)
  if (isNaN(week) || week < 1 || week > 4) {
    errors.push(`Row ${rowNumber}: Week must be a number between 1 and 4`)
  }
  
  // Validate day
  if (!task.day || task.day.trim() === '') {
    errors.push(`Row ${rowNumber}: Day is required`)
  }
  
  // Validate task description
  if (!task.task || task.task.trim() === '') {
    errors.push(`Row ${rowNumber}: Task description is required`)
  } else if (task.task.length > 500) {
    errors.push(`Row ${rowNumber}: Task description must be less than 500 characters`)
  }
  
  // Validate priority
  const validPriorities = ['high', 'medium', 'low']
  if (!task.priority || !validPriorities.includes(task.priority.toLowerCase())) {
    errors.push(`Row ${rowNumber}: Priority must be one of: ${validPriorities.join(', ')}`)
  }
  
  // Validate status (optional)
  if (task.status && task.status.trim() !== '') {
    const validStatuses = ['pending', 'completed']
    if (!validStatuses.includes(task.status.toLowerCase())) {
      errors.push(`Row ${rowNumber}: Status must be one of: ${validStatuses.join(', ')}`)
    }
  }
  
  // Validate due date (optional)
  if (task.due_date && task.due_date.trim() !== '') {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(task.due_date)) {
      errors.push(`Row ${rowNumber}: Due date must be in YYYY-MM-DD format`)
    } else {
      const date = new Date(task.due_date)
      if (isNaN(date.getTime())) {
        errors.push(`Row ${rowNumber}: Invalid due date`)
      }
    }
  }
  
  // Validate notes (optional, max length)
  if (task.notes && task.notes.length > 1000) {
    errors.push(`Row ${rowNumber}: Notes must be less than 1000 characters`)
  }
  
  return errors
}

/**
 * Validate all tasks and return formatted data
 */
export function validateAndFormatTasks(parsedData) {
  const validTasks = []
  const allErrors = []
  
  parsedData.data.forEach((task) => {
    const rowNumber = task._rowNumber
    const errors = validateTask(task, rowNumber)
    
    if (errors.length > 0) {
      allErrors.push(...errors)
    } else {
      // Format task for database insertion
      const formattedTask = {
        week: parseInt(task.week),
        day: task.day.trim(),
        task: task.task.trim(),
        priority: task.priority.toLowerCase().trim(),
        status: task.status ? task.status.toLowerCase().trim() : 'pending',
        completed: task.status && task.status.toLowerCase().trim() === 'completed',
        due_date: task.due_date && task.due_date.trim() ? task.due_date.trim() : null,
        notes: task.notes ? task.notes.trim() : null
      }
      
      validTasks.push(formattedTask)
    }
  })
  
  return {
    validTasks,
    errors: allErrors,
    hasErrors: allErrors.length > 0,
    summary: {
      total: parsedData.data.length,
      valid: validTasks.length,
      invalid: parsedData.data.length - validTasks.length
    }
  }
}

/**
 * Check for duplicate tasks
 */
export function findDuplicateTasks(newTasks, existingTasks) {
  const duplicates = []
  
  newTasks.forEach((newTask, index) => {
    const isDuplicate = existingTasks.some(existing => 
      existing.week === newTask.week &&
      existing.day === newTask.day &&
      existing.task.toLowerCase() === newTask.task.toLowerCase()
    )
    
    if (isDuplicate) {
      duplicates.push({
        index,
        task: newTask,
        message: `Task "${newTask.task}" already exists in Week ${newTask.week}, ${newTask.day}`
      })
    }
  })
  
  return duplicates
}