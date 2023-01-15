import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useRegisterMutation } from "../../gen/graphql";
import RoutePattern from "../../routes/RoutePattern";
import toRecordError from "../../utils/toRecordError";
import Button from "../Button";
import InputField from "./InputField";

const SecurityForm = () => {
  const [, register] = useRegisterMutation();
  const route = useRouter();

  return (
    <>
      <div>
        <Formik
          initialValues={{
            username: "",
            email: "",
            confirmPassword: "",
            password: "",
          }}
          onSubmit={async (values, { setErrors }) => {
            const res = await register({ options: values });

            if (res.data?.register.errors) {
              setErrors(toRecordError(res.data.register.errors));
            } else if (res.data?.register.user) {
              route.push(RoutePattern.HOME);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="mt-2">
                <InputField
                  name="password"
                  placeholder="New Password"
                  label="password"
                  type="password"
                />
              </div>
              <div className="mt-2">
                <InputField
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  label="confirm password"
                  type="password"
                />
              </div>
              <div className="mt-7">
                <Button type="submit" isSubmitting={isSubmitting}>
                  Signup
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

export default SecurityForm;
