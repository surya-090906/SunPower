// Native React page. Data contract: public/claim.
import { FieldGroup, Field, ActionForm, CsrfField } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      {data.choice1 === 0 ? (
        <>
          {"\n"}
          <div className={"card"}>
            <div className={"card-b center"}>
              <h1>{"This link has expired"}</h1>
              <p className={"muted mt-s"}>
                {
                  "The activation link is not valid or was already used. If you already set a password, "
                }
                <a href={"/login/"}>{"log in"}</a>
                {". Otherwise call us and we will send a new one."}
              </p>
            </div>
          </div>
          {"\n"}
        </>
      ) : data.choice1 === 1 ? (
        <>
          {"\n"}
          <div className={"card"}>
            <div className={"card-b"}>
              {"\n  "}
              <h1>
                {"Welcome, "}
                {data.v2}
              </h1>
              {"\n  "}
              <p className={"muted"}>
                {
                  "Set a password to track your project, documents and warranty. Your login is your mobile number "
                }
                <b>{data.v3}</b>
                {"."}
              </p>
              {"\n  "}
              <ActionForm method={"post"} className={"stack mt"}>
                <CsrfField />
                {"\n    "}
                <FieldGroup className={"field"}>
                  <label htmlFor={"pw"}>{"Choose a password"}</label>
                  <Field
                    id={"pw"}
                    className={"inp"}
                    type={"password"}
                    name={"password"}
                    minLength={"6"}
                    autoComplete={"new-password"}
                    autoFocus={true}
                    required={true}
                  />
                </FieldGroup>
                {"\n    "}
                <button className={"btn btn-primary btn-lg btn-block"}>
                  {"Activate my account"}
                </button>
                {"\n  "}
              </ActionForm>
              {"\n"}
            </div>
          </div>
          {"\n"}
        </>
      ) : null}
      {"\n"}
    </>
  );
}
