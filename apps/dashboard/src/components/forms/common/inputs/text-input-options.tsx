import type { InputHTMLAttributes } from 'react'
import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/dashboard/components/ui/button'
import { Input } from '@/dashboard/components/ui/input'
import { Label } from '@/dashboard/components/ui/label'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/dashboard/components/ui/popover'
import { ErrorDisplay } from '../error-display'

interface TextInputOptionsProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> {
  label: string
  onChange: (value: string) => void
  errors?: any
}

export function TextInputOptions({
  id,
  label,
  value,
  onChange,
  placeholder,
  errors,
  ...attributes
}: TextInputOptionsProps) {
  const itemStorageName = `${id}-items`
  const [open, setOpen] = useState(false)
  const itemList = useRef<Array<string>>([])
  const [filteredList, setFilteredList] = useState<Array<string>>([])

  const handleValueChange = (v: string) => {
    if (!v) {
      setFilteredList(itemList.current)
    }
    else {
      const filterData = itemList.current.filter(item => item.includes(v))
      if (filterData.length) {
        setFilteredList(filterData)
      }
      else {
        setOpen(false)
      }
    }
    onChange(v)
  }

  const onInputFocus = () => {
    if (filteredList.length) {
      setOpen(true)
    }
  }

  const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (v && !itemList.current.includes(e.target.value)) {
      itemList.current.push(e.target.value)
      localStorage.setItem(itemStorageName, JSON.stringify(itemList.current))
    }
    setOpen(false)
  }

  const onSelectItem = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  const onDeleteItem = (v: string) => {
    const filteredData = itemList.current.filter(item => item !== v)
    itemList.current = filteredData
    setFilteredList(filteredData)
    localStorage.setItem(itemStorageName, JSON.stringify(filteredData))
  }

  useEffect(() => {
    const data = localStorage.getItem(itemStorageName)
    if (data) {
      itemList.current = JSON.parse(data)
      setFilteredList(itemList.current)
    }
  }, [])

  return (
    <div className="grid gap-3">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Input
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={e => handleValueChange(e.target.value)}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            {...attributes}
          />
        </PopoverAnchor>
        <PopoverContent
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
          onInteractOutside={(e) => {
            if (e.target instanceof Element && e.target.id === id) {
              e.preventDefault()
            }
          }}
          className="PopoverContent flex flex-col gap-2 px-0"
        >
          {filteredList.map((item, ix) => (
            <div key={`${id}-item-${ix}`} className="flex">
              <Button
                type="button"
                variant="ghost"
                onPointerDown={(e) => {
                  e.preventDefault()
                  onSelectItem(item)
                }}
                className="flex-1 justify-start cursor-pointer"
              >
                {item}
              </Button>
              <Button
                variant="ghost"
                onPointerDown={(e) => {
                  e.preventDefault()
                  onDeleteItem(item)
                }}
                className="text-destructive cursor-pointer"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </PopoverContent>
      </Popover>
      <ErrorDisplay errors={errors} />
    </div>
  )
}
