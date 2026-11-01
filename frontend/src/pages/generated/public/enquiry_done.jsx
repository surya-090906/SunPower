// Native React page. Data contract: public/enquiry_done.
import { cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"card"}>
        <div className={"card-b center"}>
          {"\n  "}
          <div style={cssStyle("font-size:2.6rem")}>{"☀️"}</div>
          {"\n  "}
          <h1>
            {data.choice1 === 0 ? (
              <>{"We already have your enquiry"}</>
            ) : data.choice1 === 1 ? (
              <>
                {"Thank you, "}
                {data.v2}
                {"!"}
              </>
            ) : null}
          </h1>
          {"\n  "}
          <p className={"muted mt-s"}>
            {"Your reference is "}
            <b className={"mono"}>{data.v3}</b>
            {". "}
            {data.choice4 === 0 ? (
              <>{"Our team has been reminded to call you."}</>
            ) : data.choice4 === 1 ? (
              <>
                {
                  "Our team will call you within 30 minutes to check a few basics about your roof and electricity connection."
                }
              </>
            ) : null}
          </p>
          {"\n  "}
          {data.choice5 === 0 ? (
            <>
              {"\n    "}
              <hr />
              <p className={"bold"}>{"Track your project online"}</p>
              {"\n    "}
              <p className={"small muted"}>
                {
                  "Set a password to follow your survey, quote, installation and warranty."
                }
              </p>
              {"\n    "}
              <a
                className={"btn btn-primary btn-lg"}
                href={"/claim/" + text(data.v6) + "/"}
              >
                {"Create my account"}
              </a>
              {"\n  "}
            </>
          ) : data.choice5 === 1 ? (
            <>
              {"\n    "}
              <hr />
              <p className={"small muted"}>
                {"If you already have an account, "}
                <a href={"/login/"}>{"log in"}</a>
                {
                  " to follow your project. Otherwise we have sent an activation link to your mobile number."
                }
              </p>
              {"\n  "}
            </>
          ) : null}
          {"\n"}
        </div>
      </div>
      {"\n"}
    </>
  );
}
