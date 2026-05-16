'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { signUpAction, type SignUpState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initialState: SignUpState = {}

export function SignUpForm() {
  const [state, action, isPending] = useActionState(signUpAction, initialState)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          disabled={isPending}
        />
        {state.errors?.email && (
          <p className="text-sm text-red-500">{state.errors.email[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-muted-foreground">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          disabled={isPending}
        />
        {state.errors?.password && (
          <p className="text-sm text-red-500">{state.errors.password[0]}</p>
        )}
      </div>
      {state.errors?.general && (
        <p className="text-sm text-red-500">{state.errors.general[0]}</p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          'Criar conta'
        )}
      </Button>
    </form>
  )
}
