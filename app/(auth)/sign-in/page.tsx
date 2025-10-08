"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";
import { signInWithEmail } from "@/lib/actions/authActions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SignInFormData = {
  email: string;
  password: string;
};

const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormData) => {
     try {
          // signup with email server action
          const result = await signInWithEmail(data as any);
          if (result.success) router.push("/");
        } catch (error) {
          console.log(error);
          toast.error("Sign In Failed", {
            description:
              error instanceof Error
                ? error.message
                : "Failed to log in to account",
          });
        } finally {
          setIsSubmitting(false);
        }
  };

  return (
    <>
      <h1 className="form-title">Welcome back!</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          name="email"
          label="Email"
          placeholder="johndoe@email.com"
          register={register}
          error={errors.email}
          validation={{
            required: "Email is required",
            minLength: 2,
            pattern: /^\S+@\S+$/i,
            message: "Email address is invalid",
          }}
        />

        <InputField
          name="password"
          label="Password"
          placeholder="Enter your password"
          type="password"
          register={register}
          error={errors.password}
          validation={{ required: "Password is required", minLength: 8 }}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="yellow-btn w-full mt-5"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>

        <FooterLink
          text="Don't have an account?"
          linkText="Sign up"
          href="/sign-up"
        />
      </form>
    </>
  );
};

export default SignIn;
